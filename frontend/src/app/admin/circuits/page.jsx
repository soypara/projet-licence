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
import { useAT } from "@/components/admin/AdminLanguage";

export default function AdminCircuitsPage() {
  const router = useRouter();
  const { showPopup } = usePopup();
  const { ta, locale } = useAT();

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
      setError(err.message || ta("a.cir.list_load_error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreate(e) {
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
          ta("a.cir.list_upload_partial", {
            n: failures.length,
            msg: failures[0].message,
          })
        );
        setCreating(false);
        return;
      }

      // Tout est enregistré : on ouvre la page de gestion du circuit
      router.push(`/admin/circuits/${created.id}`);
    } catch (err) {
      showPopup({
        kind: "error",
        title: ta("a.cir.list_create_failed_title"),
        message: err.message || ta("a.cir.list_create_failed_msg"),
      });
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      ta("a.cir.list_confirm_delete")
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.del(`/circuits/${id}`);

      setCircuits((current) =>
        current.filter((circuit) => circuit.id !== id)
      );
    } catch (err) {
      setError(err.message || ta("a.cir.list_delete_failed"));
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
        <h1 className="adm-h1">{ta("a.cir.list_title")}</h1>
        <p className="adm-sub">{ta("a.cir.list_subtitle")}</p>
      </div>

      {error && <div className="adm-alert mb-6">{error}</div>}

      {/* Création */}
      <section className="adm-card mb-6">
        <h2 className="adm-h2">{ta("a.cir.list_add_title")}</h2>

        <form onSubmit={handleCreate} className="mt-4 grid gap-5">
          <CircuitForm value={form} onChange={setForm} places={places}>
            <PendingPhotos files={files} onChange={setFiles} />
          </CircuitForm>

          {createdId && (
            <Link
              href={`/admin/circuits/${createdId}`}
              className="adm-btn-ghost w-full sm:w-fit"
            >
              {ta("a.cir.list_open_created")}
            </Link>
          )}

          <button
            type="submit"
            disabled={creating}
            className="adm-btn w-full sm:w-fit"
          >
            {creating ? ta("a.cir.list_creating") : ta("a.cir.list_create_btn")}
          </button>
        </form>
      </section>

      {/* Liste */}
      <section className="adm-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="adm-h2">{ta("a.cir.list_existing_title")}</h2>
            <p className="adm-sub !mt-0">{ta("a.cir.list_count", { n: circuits.length })}</p>
          </div>

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={ta("a.cir.list_search_placeholder")}
            className="adm-input sm:max-w-xs"
          />
        </div>

        {loading ? (
          <div className="adm-empty">{ta("a.cir.list_loading")}</div>
        ) : filteredCircuits.length === 0 ? (
          <div className="adm-empty">{ta("a.cir.list_none_found")}</div>
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
                      {ta("a.cir.list_from_price", {
                        price: Number(circuit.price || 0).toLocaleString(locale),
                      })}
                      {circuit.duration_days
                        ? ` · ${ta("a.cir.list_duration_days", {
                            n: circuit.duration_days,
                          })}`
                        : ""}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {circuit.departures?.length
                        ? ta("a.cir.list_departures_count", {
                            n: circuit.departures.length,
                          })
                        : ta("a.cir.list_no_departures")}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={`/admin/circuits/${circuit.id}`}
                      className="adm-btn-ghost"
                    >
                      {ta("a.cir.list_manage")}
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDelete(circuit.id)}
                      className="adm-btn-danger"
                    >
                      {ta("a.cir.list_delete")}
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
