"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { usePopup } from "@/components/PopupProvider";
import CircuitForm from "@/components/admin/CircuitForm";
import PendingPhotos from "@/components/admin/PendingPhotos";
import { uploadFiles } from "@/lib/uploadMedia";
import { emptyCircuitForm, buildCircuitPayload } from "@/lib/circuitForm";

export default function AdminCircuitsPage() {
  const router = useRouter();
  const { showPopup } = usePopup();

  const [circuits, setCircuits] = useState([]);
  const [places, setPlaces] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyCircuitForm());
  const [creating, setCreating] = useState(false);
  const [files, setFiles] = useState([]);
  const [createdId, setCreatedId] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [circuitsData, placesData] = await Promise.all([
        api.get("/circuits"),
        api.get("/tourist-places"),
      ]);

      setCircuits(circuitsData || []);
      setPlaces(placesData || []);
    } catch (err) {
      setError(err.message || "Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();

    const built = buildCircuitPayload(form);

    if (built.error) {
      showPopup({
        kind: "error",
        title: "Formulaire incomplet",
        message: built.error,
      });
      return;
    }

    try {
      setCreating(true);
      setError("");

      const created = await api.post("/circuits", built.payload);

      await api.put(`/circuits/${created.id}/places`, {
        place_ids: built.placeIds,
      });

      await api.put(`/circuits/${created.id}/departures`, {
        dates: built.departures,
      });

      const failures = await uploadFiles("circuit", created.id, files);

      if (failures.length > 0) {
        // Le circuit existe : on reste ici pour afficher l'erreur
        setCreatedId(created.id);
        setError(
          `Circuit créé, mais ${failures.length} fichier(s) n'ont pas été envoyés : ${failures[0].message}`
        );
        setCreating(false);
        return;
      }

      // Tout est enregistré : on ouvre la page de gestion du circuit
      router.push(`/admin/circuits/${created.id}`);
    } catch (err) {
      showPopup({
        kind: "error",
        title: "Création impossible",
        message: err.message || "Impossible de créer le circuit.",
      });
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer ce circuit ?"
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.del(`/circuits/${id}`);

      setCircuits((current) =>
        current.filter((circuit) => circuit.id !== id)
      );
    } catch (err) {
      setError(err.message || "Impossible de supprimer le circuit.");
    }
  }

  const filteredCircuits = circuits.filter((circuit) => {
    const query = search.toLowerCase();

    return (
      circuit.title?.toLowerCase().includes(query) ||
      circuit.description?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="adm-h1">Circuits</h1>
        <p className="adm-sub">Gestion des circuits touristiques.</p>
      </div>

      {error && <div className="adm-alert mb-6">{error}</div>}

      {/* Création */}
      <section className="adm-card mb-6">
        <h2 className="adm-h2">Ajouter un circuit</h2>

        <form onSubmit={handleCreate} className="mt-4 grid gap-5">
          <CircuitForm value={form} onChange={setForm} places={places}>
            <PendingPhotos files={files} onChange={setFiles} />
          </CircuitForm>

          {createdId && (
            <Link
              href={`/admin/circuits/${createdId}`}
              className="adm-btn-ghost w-full sm:w-fit"
            >
              Ouvrir le circuit créé pour ajouter les photos
            </Link>
          )}

          <button
            type="submit"
            disabled={creating}
            className="adm-btn w-full sm:w-fit"
          >
            {creating ? "Création..." : "Créer le circuit"}
          </button>
        </form>
      </section>

      {/* Liste */}
      <section className="adm-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="adm-h2">Circuits existants</h2>
            <p className="adm-sub !mt-0">{circuits.length} circuit(s)</p>
          </div>

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="adm-input sm:max-w-xs"
          />
        </div>

        {loading ? (
          <div className="adm-empty">Chargement des circuits...</div>
        ) : filteredCircuits.length === 0 ? (
          <div className="adm-empty">Aucun circuit trouvé.</div>
        ) : (
          <div className="mt-5 space-y-3">
            {filteredCircuits.map((circuit) => (
              <article key={circuit.id} className="adm-row">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="font-sans font-semibold text-slate-100">
                      {circuit.title}
                    </h3>

                    {circuit.stops?.length >= 2 && (
                      <p className="mt-1 text-sm text-slate-400">
                        {circuit.stops[0].name} →{" "}
                        {circuit.stops[circuit.stops.length - 1].name}
                      </p>
                    )}

                    <p className="mt-2 font-mono text-sm text-emerald-400">
                      dès {Number(circuit.price || 0).toLocaleString()} MGA
                      {circuit.duration_days
                        ? ` · ${circuit.duration_days} j`
                        : ""}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {circuit.departures?.length
                        ? `${circuit.departures.length} départ(s) à venir`
                        : "Aucun départ à venir"}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={`/admin/circuits/${circuit.id}`}
                      className="adm-btn-ghost"
                    >
                      Gérer
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDelete(circuit.id)}
                      className="adm-btn-danger"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
