"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PageBackground from "@/components/PageBackground";
import BackArrow from "@/components/BackArrow";
import PasswordInput from "@/components/PasswordInput";
import { usePopup } from "@/components/PopupProvider";
import { signInWithGoogle, GOOGLE_DISABLED } from "@/lib/google";
import { useT } from "@/components/LanguageProvider";
import { friendlyError } from "@/lib/friendlyError";
import { afterLoginPath } from "@/lib/reserveFlow";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useT();
  const { showPopup } = usePopup();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const refs = useRef({});

  function fail(message) {
    showPopup({ kind: "error", title: t("auth.fail_title"), message });
  }

  async function handleRegister(event) {
    event.preventDefault();

    // Un message précis par champ
    const found = {};

    if (!email.trim()) found.email = t("v.email");
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) found.email = t("v.email_bad");

    if (!password) found.password = t("v.password");
    else if (password.length < 6) found.password = t("auth.pw_short");

    if (!confirm) found.confirm = t("v.confirm");
    else if (password && password !== confirm) found.confirm = t("auth.pw_mismatch");

    setErrors(found);

    if (Object.keys(found).length > 0) {
      const messages = Object.values(found);

      showPopup({
        kind: "error",
        title: messages.length === 1 ? t("v.title_one") : t("v.title_many"),
        message: messages.length === 1 ? messages[0] : "",
        items: messages.length === 1 ? [] : messages,
        onClose: () => {
          const first = ["email", "password", "confirm"].find((k) => found[k]);
          refs.current[first]?.focus();
        },
      });

      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      fail(friendlyError(error, t));
      return;
    }

    // Adresse déjà inscrite : Supabase ne renvoie pas d'erreur, mais aucune identité
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      fail(t("autherr.exists"));
      return;
    }

    // Sans confirmation par e-mail, la session existe déjà : on entre sur le site
    if (data.session) {
      router.push(afterLoginPath());
      router.refresh();
      return;
    }

    showPopup({
      kind: "success",
      title: t("auth.reg_done_title"),
      message: t("auth.reg_done"),
    });
  }

  async function handleGoogle() {
    const message = await signInWithGoogle();

    if (message === GOOGLE_DISABLED) fail(t("auth.google_off"));
    else if (message) fail(message);
  }

  const inputClass = (name) =>
    `input-glass ${errors[name] ? "!border-red-400 !ring-1 !ring-red-400" : ""}`;

  return (
    <>
      <PageBackground name="login" />

      <div className="mx-auto w-full max-w-md pt-2">
        <BackArrow href="/" />
      </div>

      <div className="flex min-h-[calc(100svh-13rem)] items-center justify-center">
        <form
          onSubmit={handleRegister}
          noValidate
          className="glass w-full max-w-md space-y-5 p-6 sm:p-8"
        >
          <div className="space-y-1">
            <p className="eyebrow">{t("auth.reg_eyebrow")}</p>
            <h1 className="font-serif text-3xl font-bold">{t("auth.reg_title")}</h1>
            <p className="text-sm text-white/75">{t("auth.reg_sub")}</p>
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-white/90"
            >
              {t("auth.email")}
            </label>
            <input
              ref={(el) => (refs.current.email = el)}
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((cur) => ({ ...cur, email: "" }));
              }}
              className={inputClass("email")}
            />
            {errors.email && (
              <p className="mt-1.5 text-sm text-red-200">{errors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-white/90"
            >
              {t("auth.password")}
            </label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((cur) => ({ ...cur, password: "" }));
              }}
              autoComplete="new-password"
              invalid={Boolean(errors.password)}
            />
            {errors.password && (
              <p className="mt-1.5 text-sm text-red-200">{errors.password}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirm"
              className="mb-1.5 block text-sm font-medium text-white/90"
            >
              {t("auth.confirm")}
            </label>
            <PasswordInput
              id="confirm"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setErrors((cur) => ({ ...cur, confirm: "" }));
              }}
              autoComplete="new-password"
              invalid={Boolean(errors.confirm)}
            />
            {errors.confirm && (
              <p className="mt-1.5 text-sm text-red-200">{errors.confirm}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full disabled:opacity-60"
          >
            {loading ? t("auth.reg_loading") : t("auth.reg_btn")}
          </button>

          <button
            type="button"
            onClick={handleGoogle}
            className="btn-glass w-full"
          >
            {t("auth.google")}
          </button>

          <p className="text-center text-sm text-white/75">
            {t("auth.have_account")}{" "}
            <Link href="/login" className="font-semibold text-or-clair underline">
              {t("auth.login_btn")}
            </Link>
          </p>
        </form>
      </div>
    </>
  );
}
