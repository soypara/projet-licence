"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import LemurIcon from "./LemurIcon";
import PasswordInput from "./PasswordInput";
import { useT } from "./LanguageProvider";
import { supabase } from "@/lib/supabase";
import { friendlyError } from "@/lib/friendlyError";
import { signInWithGoogle, GOOGLE_DISABLED } from "@/lib/google";

/* =========================================================
   Pop-up commun du site (même look partout) :
   - "success" / "info" : le maki, pour les bonnes nouvelles
   - "error"            : icône rouge, pour tout ce qui ne va pas
   Le fond de la page est flouté pour que le pop-up ne passe
   jamais inaperçu.
   ========================================================= */

const PopupContext = createContext({
  showPopup: () => {},
  closePopup: () => {},
  openAuth: () => {},
});

export function usePopup() {
  return useContext(PopupContext);
}

function ErrorBadge() {
  return (
    <span className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-900/40 ring-4 ring-red-300/40">
      <svg
        viewBox="0 0 24 24"
        width="44"
        height="44"
        fill="none"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M12 5v9" />
        <circle cx="12" cy="19" r="0.6" fill="#fff" />
      </svg>
    </span>
  );
}

function MascotBadge() {
  return (
    <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-or-clair to-or shadow-lg shadow-black/30 ring-4 ring-or-clair/40">
      <LemurIcon size={60} />
    </span>
  );
}

// Cadre commun : fond flouté + boîte centrée
function Overlay({ children, onBackdrop, z = "z-[100]" }) {
  return (
    <div
      className={`popup-overlay fixed inset-0 ${z} flex items-center justify-center overflow-y-auto bg-black/55 p-4 backdrop-blur-lg`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onBackdrop?.();
      }}
    >
      {children}
    </div>
  );
}

/* ---------- Pop-up d'information / d'erreur ---------- */

function MessagePopup({ popup, onClose, onConfirm }) {
  const { t } = useT();
  const buttonRef = useRef(null);
  const isError = popup.kind === "error";
  const confirmable = typeof popup.onConfirm === "function";

  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  const items = Array.isArray(popup.items) ? popup.items : [];

  return (
    <Overlay onBackdrop={onClose}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="popup-title"
        className="popup-box w-full max-w-md rounded-3xl border border-white/20 bg-emeraude-900/95 p-6 text-center shadow-2xl sm:p-8"
      >
        <div className="mb-4 flex justify-center">
          {isError ? <ErrorBadge /> : <MascotBadge />}
        </div>

        <h2
          id="popup-title"
          className={`font-serif text-2xl font-bold ${
            isError ? "text-red-200" : "text-or-clair"
          }`}
        >
          {popup.title}
        </h2>

        {popup.message && (
          <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-white/90">
            {popup.message}
          </p>
        )}

        {items.length > 0 && (
          <ul className="mt-4 space-y-2 text-left">
            {items.map((item) => (
              <li
                key={item}
                className="flex gap-2 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-50"
              >
                <span aria-hidden="true">✕</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        {confirmable ? (
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
            <button type="button" onClick={onClose} className="btn-glass w-full">
              {popup.cancelLabel || t("pop.cancel_action")}
            </button>
            <button
              ref={buttonRef}
              type="button"
              onClick={onConfirm}
              className={`w-full ${
                popup.danger
                  ? "inline-flex items-center justify-center rounded-full bg-red-500 px-6 py-3 font-semibold text-white transition hover:bg-red-400"
                  : "btn-gold"
              }`}
            >
              {popup.confirmLabel || t("pop.ok")}
            </button>
          </div>
        ) : (
          <button
            ref={buttonRef}
            type="button"
            onClick={onClose}
            className={`mt-6 w-full ${isError ? "btn-glass" : "btn-gold"}`}
          >
            {popup.confirmLabel || t("pop.ok")}
          </button>
        )}
      </div>
    </Overlay>
  );
}

/* ---------- Pop-up de connexion / inscription ---------- */

function FieldError({ text }) {
  if (!text) return null;

  return (
    <p className="mt-1.5 flex items-start gap-1.5 text-sm text-red-200">
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
      >
        !
      </span>
      {text}
    </p>
  );
}

function AuthPopup({ auth, onClose }) {
  const { t } = useT();

  const [mode, setMode] = useState(auth.mode || "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const emailRef = useRef(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const isRegister = mode === "register";

  function switchMode(next) {
    setMode(next);
    setErrors({});
    setFormError("");
    setInfo("");
  }

  function validate() {
    const found = {};

    if (!email.trim()) found.email = t("v.email");
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) found.email = t("v.email_bad");

    if (!password) found.password = t("v.password");
    else if (isRegister && password.length < 6) found.password = t("auth.pw_short");

    if (isRegister && password && password.length >= 6 && password !== confirm) {
      found.confirm = t("auth.pw_mismatch");
    }

    setErrors(found);

    return Object.keys(found).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setInfo("");

    if (!validate()) return;

    setLoading(true);

    if (!isRegister) {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      setLoading(false);

      if (error) {
        setFormError(friendlyError(error, t));
        return;
      }

      onClose({ success: true });
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setFormError(friendlyError(error, t));
      return;
    }

    // Adresse déjà inscrite : pas d'erreur côté Supabase, mais aucune identité
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setFormError(t("autherr.exists"));
      return;
    }

    if (data.session) {
      onClose({ success: true });
      return;
    }

    setInfo(t("auth.reg_done"));
  }

  async function handleGoogle() {
    setFormError("");
    auth.beforeGoogle?.();

    const message = await signInWithGoogle();

    if (message === GOOGLE_DISABLED) setFormError(t("auth.google_off"));
    else if (message) setFormError(message);
  }

  const inputClass = (name) =>
    `input-glass ${errors[name] ? "!border-red-400 !ring-1 !ring-red-400" : ""}`;

  return (
    <Overlay onBackdrop={() => onClose({ success: false })} z="z-[110]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="popup-box w-full max-w-md rounded-3xl border border-white/20 bg-emeraude-900/95 p-6 shadow-2xl sm:p-8"
      >
        <div className="mb-4 flex justify-center">
          <MascotBadge />
        </div>

        <h2
          id="auth-title"
          className="text-center font-serif text-2xl font-bold text-or-clair"
        >
          {isRegister ? t("pop.register_title") : t("pop.login_title")}
        </h2>

        <p className="mt-2 text-center text-sm text-white/85">
          {auth.reason || (isRegister ? t("pop.register_text") : t("pop.login_text"))}
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="auth-email"
              className="mb-1.5 block text-sm font-medium text-white/90"
            >
              {t("auth.email")}
            </label>
            <input
              ref={emailRef}
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className={inputClass("email")}
            />
            <FieldError text={errors.email} />
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="mb-1.5 block text-sm font-medium text-white/90"
            >
              {t("auth.password")}
            </label>
            <PasswordInput
              id="auth-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isRegister ? "new-password" : "current-password"}
              invalid={Boolean(errors.password)}
            />
            <FieldError text={errors.password} />
          </div>

          {isRegister && (
            <div>
              <label
                htmlFor="auth-confirm"
                className="mb-1.5 block text-sm font-medium text-white/90"
              >
                {t("auth.confirm")}
              </label>
              <PasswordInput
                id="auth-confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                invalid={Boolean(errors.confirm)}
              />
              <FieldError text={errors.confirm} />
            </div>
          )}

          {formError && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-300/40 bg-red-500/20 p-3 text-sm text-red-50">
              <span
                aria-hidden="true"
                className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white"
              >
                !
              </span>
              <span>{formError}</span>
            </div>
          )}

          {info && (
            <p className="rounded-2xl bg-emerald-400/20 p-3 text-sm text-emerald-50">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full disabled:opacity-60"
          >
            {isRegister
              ? loading
                ? t("auth.reg_loading")
                : t("auth.reg_btn")
              : loading
                ? t("auth.login_loading")
                : t("auth.login_btn")}
          </button>
        </form>

        <button
          type="button"
          onClick={handleGoogle}
          className="btn-glass mt-3 w-full"
        >
          {t("auth.google")}
        </button>

        <p className="mt-4 text-center text-sm text-white/80">
          {isRegister ? t("auth.have_account") : t("auth.no_account")}{" "}
          <button
            type="button"
            onClick={() => switchMode(isRegister ? "login" : "register")}
            className="font-semibold text-or-clair underline underline-offset-4"
          >
            {isRegister ? t("auth.login_btn") : t("auth.create_account")}
          </button>
        </p>

        <button
          type="button"
          onClick={() => onClose({ success: false })}
          className="mt-3 w-full text-center text-sm text-white/65 hover:text-white"
        >
          {t("pop.cancel")}
        </button>
      </div>
    </Overlay>
  );
}

/* ---------- Fournisseur ---------- */

export function PopupProvider({ children }) {
  const [popup, setPopup] = useState(null);
  const [auth, setAuth] = useState(null);

  const popupRef = useRef(null);
  const authRef = useRef(null);

  useEffect(() => {
    popupRef.current = popup;
    authRef.current = auth;
  }, [popup, auth]);

  const showPopup = useCallback((options) => {
    setPopup({ kind: "info", ...options });
  }, []);

  const closePopup = useCallback(() => {
    const current = popupRef.current;

    setPopup(null);
    current?.onClose?.();
  }, []);

  const confirmPopup = useCallback(() => {
    const current = popupRef.current;

    setPopup(null);
    current?.onConfirm?.();
  }, []);

  const openAuth = useCallback((options = {}) => {
    setAuth(options);
  }, []);

  const closeAuth = useCallback((result = {}) => {
    const current = authRef.current;

    setAuth(null);

    if (result.success) current?.onSuccess?.();
    else current?.onCancel?.();
  }, []);

  // Échap ferme le pop-up ; la page derrière ne défile plus
  const isOpen = Boolean(popup || auth);

  useEffect(() => {
    if (!isOpen) return undefined;

    function onKey(e) {
      if (e.key !== "Escape") return;

      if (authRef.current) closeAuth({ success: false });
      else closePopup();
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, closeAuth, closePopup]);

  const value = useMemo(
    () => ({ showPopup, closePopup, openAuth }),
    [showPopup, closePopup, openAuth]
  );

  return (
    <PopupContext.Provider value={value}>
      {children}

      {popup && (
        <MessagePopup
          popup={popup}
          onClose={closePopup}
          onConfirm={confirmPopup}
        />
      )}
      {auth && <AuthPopup auth={auth} onClose={closeAuth} />}
    </PopupContext.Provider>
  );
}
