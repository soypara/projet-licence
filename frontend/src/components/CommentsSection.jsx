"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { supabase } from "../lib/supabase";
import { StarsDisplay, StarsInput } from "./Stars";
import { useT } from "./LanguageProvider";
import { usePopup } from "./PopupProvider";
import { friendlyError } from "@/lib/friendlyError";

// Avis d'un circuit : note moyenne, liste des avis approuvés et formulaire.
// Le formulaire est visible pour tout le monde ; si la personne n'est pas
// connectée, un pop-up de connexion s'ouvre à l'envoi (sans quitter la page).
export default function CommentsSection({ circuitId }) {
  const { t, locale, lang } = useT();
  const { showPopup, openAuth } = usePopup();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [user, setUser] = useState(null);

  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  // Bloc replié par défaut : un clic sur "Avis" le déplie
  const [open, setOpen] = useState(false);

  // Traductions des avis : { [id]: { loading, text } }
  const [translations, setTranslations] = useState({});

  const contentRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get(
          `/comments?circuit_id=${encodeURIComponent(circuitId)}`
        );
        setComments(Array.isArray(data) ? data : []);
      } catch (e) {
        setLoadError(friendlyError(e, t));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [circuitId]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function send() {
    setSending(true);

    try {
      const created = await api.post("/comments", {
        content: content.trim(),
        rating,
        circuit_id: circuitId,
      });

      setContent("");
      setRating(0);

      showPopup({
        kind: "success",
        title: t("rev.sent_title"),
        // Publié tout de suite, sauf si un mot interdit a été détecté
        message:
          created?.status === "approved"
            ? t("rev.published_text")
            : t("rev.sent_text"),
      });
    } catch (err) {
      showPopup({
        kind: "error",
        title: t("rev.fail_title"),
        message: friendlyError(err, t),
      });
    } finally {
      setSending(false);
    }
  }

  // Traduit (ou remet l'original) un seul avis, dans la langue du site
  async function toggleTranslation(comment) {
    const current = translations[comment.id];

    if (current?.text) {
      setTranslations((cur) => ({ ...cur, [comment.id]: null }));
      return;
    }

    setTranslations((cur) => ({ ...cur, [comment.id]: { loading: true } }));

    try {
      const result = await api.post("/translate", {
        text: comment.content,
        source: "auto",
        target: lang,
      });

      if (!result?.translated) throw new Error("no translation");

      setTranslations((cur) => ({
        ...cur,
        [comment.id]: { text: result.text },
      }));
    } catch {
      setTranslations((cur) => ({ ...cur, [comment.id]: null }));

      showPopup({
        kind: "error",
        title: t("rv.translate_fail_title"),
        message: t("rv.translate_fail"),
      });
    }
  }

  function handleSubmit(e) {
    e.preventDefault();

    // Un message précis par champ
    const found = {};

    if (rating < 1) found.rating = t("v.rating");

    if (content.trim().length < 2) found.content = t("v.review");

    if (Object.keys(found).length > 0) {
      setErrors(found);

      const messages = Object.values(found);

      showPopup({
        kind: "error",
        title: messages.length === 1 ? t("v.title_one") : t("v.title_many"),
        message: messages.length === 1 ? messages[0] : "",
        items: messages.length === 1 ? [] : messages,
        onClose: () => {
          if (!found.rating && found.content) contentRef.current?.focus();
        },
      });

      return;
    }

    setErrors({});

    if (!user) {
      openAuth({ reason: t("rev.login_reason"), onSuccess: send });
      return;
    }

    send();
  }

  const average =
    comments.length > 0
      ? comments.reduce((sum, c) => sum + (c.rating || 0), 0) / comments.length
      : null;

  return (
    <section className="space-y-5">
      {/* Résumé cliquable : "Avis" */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="glass flex w-full items-center gap-4 p-5 text-left transition hover:bg-white/15"
      >
        <p className="font-serif text-4xl font-bold text-or-clair">
          {average !== null ? average.toFixed(1) : "–"}
        </p>

        <div className="min-w-0 flex-1">
          <p className="font-serif text-lg font-semibold text-white">
            {t("rv.title")}
          </p>
          <StarsDisplay value={average} className="text-lg" />
          <p className="text-sm text-white/75">
            {comments.length === 0
              ? t("reviews.none")
              : t("reviews.count", { n: comments.length })}
          </p>
        </div>

        <span className="flex shrink-0 items-center gap-2 text-sm font-semibold text-or-clair">
          <span className="hidden sm:inline">
            {open ? t("rv.hide") : t("rv.show")}
          </span>
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>

      {open && (
        <>
          {/* Formulaire */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="glass space-y-4 p-5"
          >
            <h2 className="font-serif text-xl font-semibold">
              {t("reviews.heading")}
            </h2>

            <div>
              <p className="mb-1.5 text-xs font-medium text-white/80">
                {t("reviews.your_rating")} *
              </p>
              <div
                className={`inline-block rounded-2xl px-2 py-1 ${
                  errors.rating ? "ring-1 ring-red-400" : ""
                }`}
              >
                <StarsInput
                  value={rating}
                  onChange={(v) => {
                    setRating(v);
                    setErrors((cur) => ({ ...cur, rating: "" }));
                  }}
                />
              </div>
              {errors.rating && (
                <p className="mt-1.5 text-sm text-red-200">{errors.rating}</p>
              )}
            </div>

            <div>
              <textarea
                ref={contentRef}
                className={`input-glass ${
                  errors.content ? "!border-red-400 !ring-1 !ring-red-400" : ""
                }`}
                rows={4}
                maxLength={1000}
                placeholder={t("reviews.placeholder")}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setErrors((cur) => ({ ...cur, content: "" }));
                }}
              />
              {errors.content && (
                <p className="mt-1.5 text-sm text-red-200">{errors.content}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={sending}
              className="btn-gold disabled:opacity-60"
            >
              {sending ? t("reviews.sending") : t("reviews.submit")}
            </button>
          </form>

          {/* Liste */}
          {loadError && (
            <div className="glass p-4 text-sm text-red-100">{loadError}</div>
          )}

          {loading ? (
            <div className="glass h-24 animate-pulse" />
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => {
                const tr = translations[c.id];

                return (
                  <li key={c.id} className="glass flex gap-4 p-5">
                    <span
                      aria-hidden="true"
                      className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-gradient-to-br from-or-clair to-or font-serif text-lg font-bold text-emeraude-950"
                    >
                      {c.author_initial || "?"}
                    </span>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <StarsDisplay value={c.rating} />
                        <span className="text-xs text-white/60">
                          {c.created_at
                            ? new Date(c.created_at).toLocaleDateString(locale)
                            : ""}
                        </span>
                      </div>

                      <p className="whitespace-pre-line text-sm leading-relaxed text-white/90">
                        {tr?.text || c.content}
                      </p>

                      <button
                        type="button"
                        onClick={() => toggleTranslation(c)}
                        disabled={tr?.loading}
                        className="text-xs font-semibold text-or-clair underline underline-offset-4 disabled:opacity-60"
                      >
                        {tr?.loading
                          ? t("rv.translating")
                          : tr?.text
                          ? t("rv.original")
                          : t("rv.translate")}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
