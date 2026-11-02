"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function AdminCommentsPage() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadComments() {
    try {
      setLoading(true);
      setError("");

      const data =
        await api.get("/comments/admin");

      setComments(data || []);
    } catch (err) {
      setError(
        err.message ||
          "Impossible de charger les commentaires."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComments();
  }, []);

  async function updateStatus(id, status) {
    try {
      await api.put(
        `/comments/${id}/status`,
        { status }
      );

      setComments((current) =>
        current.map((comment) =>
          comment.id === id
            ? { ...comment, status }
            : comment
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (
      !window.confirm(
        "Supprimer ce commentaire ?"
      )
    ) {
      return;
    }

    try {
      await api.del(`/comments/${id}`);

      setComments((current) =>
        current.filter(
          (comment) => comment.id !== id
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }

  const STATUS_STYLE = {
    approved: "border-emerald-500/40 text-emerald-300",
    rejected: "border-amber-500/40 text-amber-300",
  };

  const STATUS_LABEL = {
    pending: "En attente",
    approved: "Approuvé",
    rejected: "Rejeté",
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="adm-h1">Commentaires</h1>
        <p className="adm-sub">Modération des avis des utilisateurs.</p>
      </div>

      {error && <div className="adm-alert mb-6">{error}</div>}

      <section className="adm-card">
        {loading ? (
          <p className="adm-empty">Chargement...</p>
        ) : comments.length === 0 ? (
          <p className="adm-empty">Aucun commentaire.</p>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <article key={comment.id} className="adm-row">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400">
                        {"★".repeat(comment.rating || 0)}
                      </span>

                      <span
                        className={`adm-badge ${
                          STATUS_STYLE[comment.status] || ""
                        }`}
                      >
                        {STATUS_LABEL[comment.status] || comment.status}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-200">
                      {comment.content}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      {comment.circuits?.title ||
                        comment.tourist_places?.name ||
                        "Circuit inconnu"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {comment.status !== "approved" && (
                      <button
                        onClick={() => updateStatus(comment.id, "approved")}
                        className="adm-btn-ok"
                      >
                        Approuver
                      </button>
                    )}

                    {comment.status !== "rejected" && (
                      <button
                        onClick={() => updateStatus(comment.id, "rejected")}
                        className="adm-btn-warn"
                      >
                        Rejeter
                      </button>
                    )}

                    <button
                      onClick={() => remove(comment.id)}
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
