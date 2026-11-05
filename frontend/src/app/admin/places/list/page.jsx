"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import MediaManager from "@/components/admin/MediaManager";
import { useAT } from "@/components/admin/AdminLanguage";

export default function AdminPlacesListPage() {
  const { ta } = useAT();

  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [mediaOpenId, setMediaOpenId] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setError("");
      setPlaces((await api.get("/tourist-places")) || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(p) {
    setEditingId(p.id);
    setEditForm({
      name: p.name,
      description: p.description || "",
      latitude: p.latitude,
      longitude: p.longitude,
    });
  }

  async function saveEdit(id) {
    try {
      setSaving(true);
      setError("");
      await api.put(`/tourist-places/${id}`, {
        name: editForm.name,
        description: editForm.description,
        latitude: Number(editForm.latitude),
        longitude: Number(editForm.longitude),
      });
      setEditingId(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(ta("a.plc.list_confirm_delete"))) return;

    try {
      setError("");
      await api.del(`/tourist-places/${id}`);
      setPlaces((current) => current.filter((p) => p.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  const query = search.toLowerCase();
  const filtered = places.filter(
    (p) =>
      p.name?.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query)
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="adm-h1">{ta("a.plc.title")}</h1>
        <p className="adm-sub">{ta("a.plc.list_subtitle")}</p>

        <div className="mt-4 flex gap-2">
          <Link href="/admin/places" className="adm-btn-ghost">
            {ta("a.plc.list_import")}
          </Link>
          <span className="adm-btn-ok cursor-default">{ta("a.plc.existing_places")}</span>
        </div>
      </div>

      {error && <div className="adm-alert mb-6">{error}</div>}

      <section className="adm-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="adm-sub !mt-0">{ta("a.plc.list_count", { n: places.length })}</p>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={ta("a.plc.list_search_placeholder")}
            className="adm-input sm:max-w-xs"
          />
        </div>

        {loading ? (
          <p className="adm-empty">{ta("a.plc.list_loading")}</p>
        ) : filtered.length === 0 ? (
          <p className="adm-empty">{ta("a.plc.list_empty")}</p>
        ) : (
          <div className="mt-5 space-y-3">
            {filtered.map((p) => (
              <article key={p.id} className="adm-row">
                {editingId === p.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="adm-label">{ta("a.plc.list_label_name")}</label>
                      <input
                        className="adm-input"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="adm-label">{ta("a.plc.list_label_description")}</label>
                      <textarea
                        className="adm-input"
                        rows={4}
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="adm-label">{ta("a.plc.list_label_lat")}</label>
                        <input
                          className="adm-input"
                          type="number"
                          step="any"
                          value={editForm.latitude}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              latitude: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="adm-label">{ta("a.plc.list_label_lon")}</label>
                        <input
                          className="adm-input"
                          type="number"
                          step="any"
                          value={editForm.longitude}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              longitude: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => saveEdit(p.id)}
                        className="adm-btn"
                      >
                        {saving ? ta("a.plc.list_saving") : ta("a.plc.list_save")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="adm-btn-ghost"
                      >
                        {ta("a.plc.list_cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="font-sans font-semibold text-slate-100">
                          {p.name}
                        </h3>
                        {p.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                            {p.description}
                          </p>
                        )}
                        <p className="mt-2 font-mono text-xs text-slate-500">
                          {p.latitude}, {p.longitude}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setMediaOpenId(mediaOpenId === p.id ? null : p.id)
                          }
                          className="adm-btn-ghost"
                        >
                          {ta("a.plc.list_photos")}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          className="adm-btn-ghost"
                        >
                          {ta("a.plc.list_edit")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          className="adm-btn-danger"
                        >
                          {ta("a.plc.list_delete")}
                        </button>
                      </div>
                    </div>

                    {mediaOpenId === p.id && (
                      <div className="mt-4 border-t border-slate-800 pt-4">
                        <MediaManager
                          entityType="tourist_place"
                          entityId={p.id}
                        />
                      </div>
                    )}
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
