"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import ManualPlaceForm from "@/components/admin/ManualPlaceForm";

export default function PlacesPage() {
  // "search" : recherche en ligne (comme avant) ; "manual" : tout à la main
  const [mode, setMode] = useState("search");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [localImages, setLocalImages] = useState([]);

  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");

  async function handleSearch(e) {
    e.preventDefault();

    if (!query.trim()) return;

    setLoading(true);
    setSelectedPlace(null);
    setSelectedImages([]);
    setLocalImages([]);
    setImportMessage("");

    try {
      const response = await fetch(
        `${API_URL}/place-search/search?q=${encodeURIComponent(
          query
        )}`
      );

      const data = await response.json();

      setResults(data.results || []);
    } catch (error) {
      console.error("Erreur recherche :", error);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectPlace(place) {
    setSelectedPlace(place);
    setSelectedImages([]);
    setLocalImages([]);
    setImportMessage("");
  }

  function toggleImage(image) {
    setSelectedImages((current) => {
      const alreadySelected = current.some(
        (selected) => selected.url === image.url
      );

      if (alreadySelected) {
        return current.filter(
          (selected) => selected.url !== image.url
        );
      }

      return [...current, image];
    });
  }

  function handleLocalImages(event) {
    const files = Array.from(event.target.files || []);

    const newImages = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      file,
      url: URL.createObjectURL(file),
      name: file.name,
    }));

    setLocalImages((current) => [...current, ...newImages]);

    event.target.value = "";
  }

  function removeLocalImage(id) {
    setLocalImages((current) => {
      const image = current.find((item) => item.id === id);

      if (image) {
        URL.revokeObjectURL(image.url);
      }

      return current.filter((item) => item.id !== id);
    });
  }

  async function handleImport() {
    if (!selectedPlace) return;

    if (
      selectedImages.length === 0 &&
      localImages.length === 0
    ) {
      return;
    }

    setImporting(true);
    setImportMessage("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(
          "Vous devez être connecté pour importer un lieu."
        );
      }

      const token = session.access_token;

      /*
       * 1. Préparation des photos Internet.
       */

      const internetMedia = selectedImages.map((image, index) => ({
        url: image.url,
        type: "photo",
        alt_text: image.title,
        caption:
          index === 0
            ? selectedPlace.name
            : image.title.replace(/^Fichier:/, ""),
        sort_order: index + 1,
      }));

      /*
       * 2. Création du lieu + photos Internet.
       */

      const placeResponse = await fetch(
        `${API_URL}/place-search/import`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: selectedPlace.name,
            description:
              selectedPlace.wikipedia?.description || "",
            latitude: selectedPlace.latitude,
            longitude: selectedPlace.longitude,
            source_url:
              selectedPlace.wikipedia?.sourceUrl || "",
            media: internetMedia,
          }),
        }
      );

      const placeData = await placeResponse.json();

      if (!placeResponse.ok) {
        throw new Error(
          placeData.message ||
            "Impossible d'importer le lieu."
        );
      }

      const placeId = placeData.place.id;

      /*
       * 3. Upload des photos locales.
       */

      for (
        let index = 0;
        index < localImages.length;
        index++
      ) {
        const localImage = localImages[index];

        const formData = new FormData();

        formData.append("file", localImage.file);
        formData.append("type", "photo");
        formData.append("alt_text", localImage.name);
        formData.append("entity_type", "tourist_place");
        formData.append("entity_id", placeId);

        formData.append(
          "caption",
          selectedImages.length === 0 && index === 0
            ? selectedPlace.name
            : localImage.name
        );

        formData.append(
          "sort_order",
          String(selectedImages.length + index + 1)
        );

        const mediaResponse = await fetch(
          `${API_URL}/media`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        const mediaData = await mediaResponse.json();

        if (!mediaResponse.ok) {
          throw new Error(
            mediaData.message ||
              `Impossible d'importer la photo ${localImage.name}.`
          );
        }
      }

      setImportMessage(
        `✅ "${selectedPlace.name}" a été importé avec succès.`
      );

      setSelectedPlace(null);
      setSelectedImages([]);
      setLocalImages([]);
    } catch (error) {
      console.error("Erreur import :", error);

      setImportMessage(
        `❌ ${
          error.message ||
          "Une erreur est survenue pendant l'import."
        }`
      );
    } finally {
      setImporting(false);
    }
  }

  useEffect(() => {
    return () => {
      localImages.forEach((image) => {
        URL.revokeObjectURL(image.url);
      });
    };
  }, [localImages]);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="adm-h1">Lieux touristiques</h1>
      <p className="adm-sub">
        Rechercher un lieu touristique à Madagascar, ou l&apos;ajouter à la main.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("search")}
          className={mode === "search" ? "adm-btn-ok" : "adm-btn-ghost"}
        >
          Rechercher en ligne
        </button>
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={mode === "manual" ? "adm-btn-ok" : "adm-btn-ghost"}
        >
          Ajouter à la main
        </button>
        <Link href="/admin/places/list" className="adm-btn-ghost">
          Lieux existants
        </Link>
      </div>

      {mode === "manual" && <ManualPlaceForm />}

      {mode === "search" && (
        <>
      {/* Recherche */}
      <form
        onSubmit={handleSearch}
        className="mt-6 flex flex-col gap-3 sm:flex-row"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex. Allée des Baobabs"
          className="adm-input"
        />

        <button
          type="submit"
          disabled={loading}
          className="adm-btn w-full sm:w-auto"
        >
          {loading ? "Recherche..." : "Rechercher"}
        </button>
      </form>

      {/* Message import */}
      {importMessage && <div className="adm-note mt-6">{importMessage}</div>}

      {/* Résultats */}
      <div className="mt-8 space-y-5">
        {results.map((place) => {
          const isSelected =
            selectedPlace?.osmType === place.osmType &&
            selectedPlace?.osmId === place.osmId;

          return (
            <div
              key={`${place.osmType}-${place.osmId}`}
              className={`overflow-hidden rounded-xl border bg-slate-900 ${
                isSelected
                  ? "border-emerald-500 ring-1 ring-emerald-500/40"
                  : "border-slate-800"
              }`}
            >
              {/* Informations du lieu */}
              <div className="p-4 sm:p-5">
                <h2 className="adm-h2 text-lg">{place.name}</h2>

                <p className="mt-1 text-sm text-slate-400">{place.address}</p>

                <p className="mt-2 font-mono text-xs text-slate-500">
                  {place.latitude}, {place.longitude}
                </p>

                {place.wikipedia?.description && (
                  <p className="mt-4 text-sm leading-relaxed text-slate-300">
                    {place.wikipedia.description}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => handleSelectPlace(place)}
                  className={`mt-5 w-full sm:w-auto ${
                    isSelected ? "adm-btn-ok !px-5 !py-2.5" : "adm-btn"
                  }`}
                >
                  {isSelected ? "Lieu sélectionné" : "Sélectionner ce lieu"}
                </button>
              </div>

              {/* Zone de sélection */}
              {isSelected && (
                <div className="border-t border-slate-800 bg-slate-950/60 p-4 sm:p-5">
                  <h3 className="adm-h2">Photos du lieu</h3>

                  {/* Photos Internet */}
                  <div className="mt-5">
                    <h4 className="text-sm font-medium text-slate-200">
                      Photos disponibles sur Internet
                    </h4>

                    {place.images?.length > 0 ? (
                      <>
                        <p className="mb-4 mt-1 text-sm text-slate-400">
                          Sélectionne les photos que tu souhaites importer.
                        </p>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {place.images.map((image, index) => {
                            const checked = selectedImages.some(
                              (selected) => selected.url === image.url
                            );

                            return (
                              <button
                                type="button"
                                key={image.url}
                                onClick={() => toggleImage(image)}
                                className={`overflow-hidden rounded-lg border-2 bg-slate-900 text-left ${
                                  checked
                                    ? "border-emerald-500"
                                    : "border-slate-800"
                                }`}
                              >
                                <img
                                  src={image.url}
                                  alt={image.title}
                                  className="h-52 w-full object-cover"
                                />

                                <div className="p-3">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      readOnly
                                      className="accent-emerald-500"
                                    />

                                    <span className="text-sm font-medium text-slate-100">
                                      Photo {index + 1}
                                    </span>
                                  </div>

                                  <p className="mt-1 text-xs text-slate-400">
                                    {image.title.replace(/^Fichier:/, "")}
                                  </p>

                                  {image.license && (
                                    <p className="mt-2 text-xs text-slate-500">
                                      Licence : {image.license}
                                    </p>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">
                        Aucune photo disponible depuis cette source.
                      </p>
                    )}
                  </div>

                  {/* Photos locales */}
                  <div className="mt-8">
                    <h4 className="text-sm font-medium text-slate-200">
                      Photos depuis l&apos;appareil
                    </h4>

                    <p className="mt-1 text-sm text-slate-400">
                      Ajoute tes propres photos si nécessaire.
                    </p>

                    <label className="adm-btn-ghost mt-4 w-full cursor-pointer !py-2.5 sm:w-auto">
                      + Ajouter des photos
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleLocalImages}
                        className="hidden"
                      />
                    </label>

                    {localImages.length > 0 && (
                      <div className="mt-5">
                        <p className="mb-3 text-sm font-medium text-slate-200">
                          Photos locales ajoutées : {localImages.length}
                        </p>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {localImages.map((image) => (
                            <div
                              key={image.id}
                              className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900"
                            >
                              <img
                                src={image.url}
                                alt={image.name}
                                className="h-52 w-full object-cover"
                              />

                              <div className="flex items-center justify-between gap-3 p-3">
                                <p className="truncate text-sm text-slate-300">
                                  {image.name}
                                </p>

                                <button
                                  type="button"
                                  onClick={() => removeLocalImage(image.id)}
                                  className="adm-btn-danger shrink-0"
                                >
                                  Retirer
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Import */}
                  {(selectedImages.length > 0 || localImages.length > 0) && (
                    <div className="adm-card mt-8">
                      <h3 className="adm-h2">Prêt à importer</h3>

                      <p className="mt-2 text-sm text-slate-200">
                        <strong>{place.name}</strong>
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {selectedImages.length} photo
                        {selectedImages.length > 1 ? "s" : ""} Internet +{" "}
                        {localImages.length} photo
                        {localImages.length > 1 ? "s" : ""} locale
                        {localImages.length > 1 ? "s" : ""}
                      </p>

                      <button
                        type="button"
                        onClick={handleImport}
                        disabled={importing}
                        className="adm-btn mt-4 w-full sm:w-auto"
                      >
                        {importing
                          ? "Importation en cours..."
                          : "Importer ce lieu"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
        </>
      )}
    </div>
  );
}
