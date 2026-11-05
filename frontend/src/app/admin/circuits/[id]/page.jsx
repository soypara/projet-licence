"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { usePopup } from "@/components/PopupProvider";
import MediaManager from "@/components/admin/MediaManager";
import CircuitForm from "@/components/admin/CircuitForm";
import { formFromCircuit, emptyCircuitForm, buildCircuitPayload } from "@/lib/circuitForm";
import { useAT } from "@/components/admin/AdminLanguage";

export default function CircuitDetailPage() {
  const params = useParams();
  const id = params.id;
  const { showPopup } = usePopup();
  const { ta } = useAT();

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
          ta("a.cir.manage_load_error")
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

    const built = buildCircuitPayload(form, ta);

    if (built.error) {
      showPopup({
        kind: "error",
        title: ta("a.cir.list_incomplete_title"),
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
        title: ta("a.cir.manage_saved_title"),
        message: ta("a.cir.manage_saved_msg"),
      });
    } catch (err) {
      showPopup({
        kind: "error",
        title: ta("a.cir.manage_save_failed_title"),
        message: err.message || ta("a.cir.manage_save_failed_msg"),
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="adm-empty">{ta("a.cir.manage_loading")}</div>;
  }

  if (!circuit) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="adm-alert">
          {error || ta("a.cir.manage_not_found")}
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
        <h2 className="adm-h2">{ta("a.cir.manage_reservations_title")}</h2>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="adm-row">
            <p className="text-2xl font-semibold text-slate-50">
              {reservations.length}
            </p>
            <p className="text-xs text-slate-400">{ta("a.cir.manage_total")}</p>
          </div>
          <div className="adm-row">
            <p className="text-2xl font-semibold text-amber-300">
              {counts.pending || 0}
            </p>
            <p className="text-xs text-slate-400">{ta("a.cir.manage_pending")}</p>
          </div>
          <div className="adm-row">
            <p className="text-2xl font-semibold text-emerald-300">
              {counts.confirmed || 0}
            </p>
            <p className="text-xs text-slate-400">{ta("a.cir.manage_confirmed")}</p>
          </div>
          <div className="adm-row">
            <p className="text-2xl font-semibold text-slate-50">
              {travelersConfirmed}
            </p>
            <p className="text-xs text-slate-400">{ta("a.cir.manage_travelers_confirmed")}</p>
          </div>
        </div>

        <Link
          href="/admin/reservations"
          className="adm-btn-ghost mt-4 w-full sm:w-fit"
        >
          {ta("a.cir.manage_process_reservations")}
        </Link>
      </section>

      <section className="adm-card">
        <h2 className="adm-h2">{ta("a.cir.manage_info_title")}</h2>

        {message && <div className="adm-note mt-4">{message}</div>}

        <form onSubmit={handleSave} className="mt-4 grid gap-5">
          <CircuitForm value={form} onChange={setForm} places={places}>
            <MediaManager entityType="circuit" entityId={id} />
          </CircuitForm>

          <button disabled={saving} className="adm-btn w-full sm:w-fit">
            {saving ? ta("a.cir.manage_saving") : ta("a.cir.manage_save")}
          </button>
        </form>
      </section>
    </div>
  );
}
