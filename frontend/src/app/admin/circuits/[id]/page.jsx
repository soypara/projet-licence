"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { usePopup } from "@/components/PopupProvider";
import MediaManager from "@/components/admin/MediaManager";
import CircuitForm from "@/components/admin/CircuitForm";
import { formFromCircuit, emptyCircuitForm, buildCircuitPayload } from "@/lib/circuitForm";

export default function CircuitDetailPage() {
  const params = useParams();
  const id = params.id;
  const { showPopup } = usePopup();

  const [circuit, setCircuit] = useState(null);
  const [places, setPlaces] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState(emptyCircuitForm());
  const [reservations, setReservations] = useState([]);
  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [circuitData, placesData, reservationsData] = await Promise.all([
        api.get(`/circuits/${id}`),
        api.get("/tourist-places"),
        api.get("/reservations").catch(() => []),
      ]);

      setCircuit(circuitData);
      setPlaces(placesData || []);
      setReservations(
        (reservationsData || []).filter((r) => r.circuit_id === id)
      );
      setForm(formFromCircuit(circuitData));
    } catch (err) {
      setError(
        err.message ||
          "Impossible de charger le circuit."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  async function handleSave(e) {
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
      setSaving(true);
      setError("");
      setMessage("");

      await api.put(`/circuits/${id}`, built.payload);
      await api.put(`/circuits/${id}/places`, { place_ids: built.placeIds });
      await api.put(`/circuits/${id}/departures`, { dates: built.departures });

      await loadData();

      showPopup({
        kind: "success",
        title: "Circuit enregistré",
        message: "Les modifications sont en ligne.",
      });
    } catch (err) {
      showPopup({
        kind: "error",
        title: "Enregistrement impossible",
        message: err.message || "Réessaie dans un instant.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="adm-empty">Chargement...</div>;
  }

  if (!circuit) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="adm-alert">
          {error || "Circuit introuvable."}
        </div>
      </div>
    );
  }

  const counts = reservations.reduce(
    (acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }),
    {}
  );
  const travelersConfirmed = reservations
    .filter((r) => r.status === "confirmed")
    .reduce((sum, r) => sum + (r.travelers || 0), 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="adm-h1">{circuit.title}</h1>
      </div>

      {error && <div className="adm-alert">{error}</div>}

      <section className="adm-card">
        <h2 className="adm-h2">Réservations</h2>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="adm-row">
            <p className="text-2xl font-semibold text-slate-50">
              {reservations.length}
            </p>
            <p className="text-xs text-slate-400">au total</p>
          </div>
          <div className="adm-row">
            <p className="text-2xl font-semibold text-amber-300">
              {counts.pending || 0}
            </p>
            <p className="text-xs text-slate-400">en attente</p>
          </div>
          <div className="adm-row">
            <p className="text-2xl font-semibold text-emerald-300">
              {counts.confirmed || 0}
            </p>
            <p className="text-xs text-slate-400">confirmées</p>
          </div>
          <div className="adm-row">
            <p className="text-2xl font-semibold text-slate-50">
              {travelersConfirmed}
            </p>
            <p className="text-xs text-slate-400">voyageurs confirmés</p>
          </div>
        </div>

        <Link
          href="/admin/reservations"
          className="adm-btn-ghost mt-4 w-full sm:w-fit"
        >
          Traiter les réservations
        </Link>
      </section>

      <section className="adm-card">
        <h2 className="adm-h2">Informations</h2>

        {message && <div className="adm-note mt-4">{message}</div>}

        <form onSubmit={handleSave} className="mt-4 grid gap-5">
          <CircuitForm value={form} onChange={setForm} places={places}>
            <MediaManager entityType="circuit" entityId={id} />
          </CircuitForm>

          <button disabled={saving} className="adm-btn w-full sm:w-fit">
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      </section>
    </div>
  );
}
