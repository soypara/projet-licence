"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { uploadFiles } from "@/lib/uploadMedia";
import { usePopup } from "@/components/PopupProvider";
import PendingPhotos from "./PendingPhotos";

const EMPTY = { name: "", description: "", latitude: "", longitude: "" };

// Nombre saisi avec une virgule ou un point ("-18,9" ou "-18.9")
function toNumber(text) {
  const clean = String(text).trim().replace(",", ".");

  return clean === "" ? NaN : Number(clean);
}

// Ajout d'un lieu entièrement à la main : nom, description, coordonnées,
// photos depuis l'ordinateur. (La recherche en ligne reste disponible.)
export default function ManualPlaceForm() {
  const { showPopup } = usePopup();

  const [form, setForm] = useState(EMPTY);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function change(e) {
    const { name, value } = e.target;

    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  function validate() {
    const found = {};
    const lat = toNumber(form.latitude);
    const lon = toNumber(form.longitude);

    if (form.name.trim().length < 2) {
      found.name = "Saisis le nom du lieu (2 caractères minimum).";
    }

    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      found.latitude = "Latitude invalide : un nombre entre -90 et 90 (ex. -18,9).";
    }

    if (Number.isNaN(lon) || lon < -180 || lon > 180) {
      found.longitude = "Longitude invalide : un nombre entre -180 et 180 (ex. 47,5).";
    }

    return { found, lat, lon };
  }

  async function save(lat, lon) {
    try {
      setSaving(true);

      const place = await api.post("/tourist-places", {
        name: form.name.trim(),
        description: form.description.trim(),
        latitude: lat,
        longitude: lon,
        source_url: "",
      });

      const failures = await uploadFiles("tourist_place", place.id, files);

      setForm(EMPTY);
      setFiles([]);

      showPopup({
        kind: failures.length ? "error" : "success",
        title: failures.length ? "Lieu créé, photos manquantes" : "Lieu ajouté",
        message: failures.length
          ? `« ${place.name} » est créé, mais ${failures.length} photo(s) n'ont pas été envoyées : ${failures[0].message}`
          : `« ${place.name} » est maintenant disponible pour les circuits.`,
      });
    } catch (err) {
      showPopup({
        kind: "error",
        title: "Lieu non ajouté",
        message: err.message || "Réessaie dans un instant.",
      });
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();

    const { found, lat, lon } = validate();

    if (Object.keys(found).length > 0) {
      setErrors(found);

      const messages = Object.values(found);

      showPopup({
        kind: "error",
        title: messages.length === 1 ? "Il manque une information" : "Il manque des informations",
        message: messages.length === 1 ? messages[0] : "",
        items: messages.length === 1 ? [] : messages,
      });

      return;
    }

    // Coordonnées hors de Madagascar : probablement une faute de frappe
    const inMadagascar = lat >= -26 && lat <= -11 && lon >= 43 && lon <= 51;

    if (!inMadagascar) {
      showPopup({
        kind: "error",
        title: "Ces coordonnées sont hors de Madagascar",
        message:
          "Vérifie le signe de la latitude (à Madagascar elle est négative, ex. -18,9). Enregistrer quand même ?",
        confirmLabel: "Enregistrer quand même",
        cancelLabel: "Corriger",
        onConfirm: () => save(lat, lon),
      });

      return;
    }

    save(lat, lon);
  }

  const bad = (name) =>
    errors[name] ? "!border-red-500 !ring-1 !ring-red-500" : "";

  return (
    <form onSubmit={handleSubmit} noValidate className="adm-card mt-6 grid gap-5">
      <p className="adm-note">
        Pour un lieu qu&apos;on ne trouve pas en ligne : tout se saisit à la
        main, les photos viennent de ton ordinateur.
      </p>

      <div>
        <label htmlFor="m-name" className="adm-label">
          Nom du lieu *
        </label>
        <input
          id="m-name"
          name="name"
          value={form.name}
          onChange={change}
          className={`adm-input ${bad("name")}`}
        />
        {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="m-desc" className="adm-label">
          Description (affichée dans les étapes du circuit)
        </label>
        <textarea
          id="m-desc"
          name="description"
          rows={5}
          value={form.description}
          onChange={change}
          className="adm-input"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="m-lat" className="adm-label">
            Latitude *
          </label>
          <input
            id="m-lat"
            name="latitude"
            inputMode="decimal"
            placeholder="-18,9"
            value={form.latitude}
            onChange={change}
            className={`adm-input ${bad("latitude")}`}
          />
          {errors.latitude && (
            <p className="mt-1 text-sm text-red-400">{errors.latitude}</p>
          )}
        </div>

        <div>
          <label htmlFor="m-lon" className="adm-label">
            Longitude *
          </label>
          <input
            id="m-lon"
            name="longitude"
            inputMode="decimal"
            placeholder="47,5"
            value={form.longitude}
            onChange={change}
            className={`adm-input ${bad("longitude")}`}
          />
          {errors.longitude && (
            <p className="mt-1 text-sm text-red-400">{errors.longitude}</p>
          )}
        </div>
      </div>

      <p className="-mt-2 text-xs text-slate-500">
        À Madagascar : latitude entre -26 et -11, longitude entre 43 et 51.
      </p>

      <div>
        <label className="adm-label">Photos (depuis cet ordinateur)</label>
        <PendingPhotos files={files} onChange={setFiles} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="submit" disabled={saving} className="adm-btn w-full sm:w-auto">
          {saving ? "Enregistrement..." : "Ajouter le lieu"}
        </button>

        <Link href="/admin/places/list" className="adm-btn-ghost w-full sm:w-auto">
          Lieux existants
        </Link>
      </div>
    </form>
  );
}
