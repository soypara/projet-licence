"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAT } from "@/components/admin/AdminLanguage";

export default function AdminCommentsPage() {
  const { ta } = useAT();
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
          ta("a.com.load_error")
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
        ta("a.com.confirm_delete")
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
    pending: ta("a.com.status_pending"),
    approved: ta("a.com.status_approved"),
    rejected: ta("a.com.status_rejected"),
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="adm-h1">{ta("a.com.title")}</h1>
        <p className="adm-sub">{ta("a.com.subtitle")}</p>
      </div>

      {error && <div className="adm-alert mb-6">{error}</div>}

      <section className="adm-card">
        {loading ? (
          <p className="adm-empty">{ta("a.com.loading")}</p>
        ) : comments.length === 0 ? (
          <p className="adm-empty">{ta("a.com.none")}</p>
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
                        ta("a.com.unknown_circuit")}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {comment.status !== "approved" && (
                      <button
                        onClick={() => updateStatus(comment.id, "approved")}
                        className="adm-btn-ok"
                      >
                        {ta("a.com.approve")}
                      </button>
                    )}

                    {comment.status !== "rejected" && (
                      <button
                        onClick={() => updateStatus(comment.id, "rejected")}
                        className="adm-btn-warn"
                      >
                        {ta("a.com.reject")}
                      </button>
                    )}

                    <button
                      onClick={() => remove(comment.id)}
                      className="adm-btn-danger"
                    >
                      {ta("a.com.delete")}
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
