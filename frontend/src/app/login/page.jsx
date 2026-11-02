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

export default function LoginPage() {
  const router = useRouter();
  const { t } = useT();
  const { showPopup } = usePopup();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  function fail(message) {
    showPopup({ kind: "error", title: t("auth.fail_title"), message });
  }

  async function handleLogin(event) {
    event.preventDefault();

    // Un message précis par champ
    const found = {};

    if (!email.trim()) found.email = t("v.email");
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) found.email = t("v.email_bad");

    if (!password) found.password = t("v.password");

    setErrors(found);

    if (Object.keys(found).length > 0) {
      const messages = Object.values(found);

      showPopup({
        kind: "error",
        title: messages.length === 1 ? t("v.title_one") : t("v.title_many"),
        message: messages.length === 1 ? messages[0] : "",
        items: messages.length === 1 ? [] : messages,
        onClose: () =>
          (found.email ? emailRef : passwordRef).current?.focus(),
      });

      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      fail(friendlyError(error, t));
      setLoading(false);
      return;
    }

    router.push(afterLoginPath());
    router.refresh();
  }

  async function handleGoogle() {
    const message = await signInWithGoogle();

    if (message === GOOGLE_DISABLED) fail(t("auth.google_off"));
    else if (message) fail(message);
  }

  return (
    <>
      <PageBackground name="login" />

      <div className="mx-auto w-full max-w-md pt-2">
        <BackArrow href="/" />
      </div>

      <div className="flex min-h-[calc(100svh-13rem)] items-center justify-center">
        <form
          onSubmit={handleLogin}
          noValidate
          className="glass w-full max-w-md space-y-5 p-6 sm:p-8"
        >
          <div className="space-y-1">
            <p className="eyebrow">{t("auth.login_eyebrow")}</p>
            <h1 className="font-serif text-3xl font-bold">{t("auth.login_title")}</h1>
            <p className="text-sm text-white/75">{t("auth.login_sub")}</p>
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-white/90"
            >
              {t("auth.email")}
            </label>
            <input
              ref={emailRef}
              id="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setErrors((cur) => ({ ...cur, email: "" }));
              }}
              className={`input-glass ${
                errors.email ? "!border-red-400 !ring-1 !ring-red-400" : ""
              }`}
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
              onChange={(event) => {
                setPassword(event.target.value);
                setErrors((cur) => ({ ...cur, password: "" }));
              }}
              autoComplete="current-password"
              invalid={Boolean(errors.password)}
            />
            {errors.password && (
              <p className="mt-1.5 text-sm text-red-200">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full disabled:opacity-60"
          >
            {loading ? t("auth.login_loading") : t("auth.login_btn")}
          </button>

          <button
            type="button"
            onClick={handleGoogle}
            className="btn-glass w-full"
          >
            {t("auth.google")}
          </button>

          <p className="text-center text-sm text-white/75">
            {t("auth.no_account")}{" "}
            <Link
              href="/register"
              className="font-semibold text-or-clair underline"
            >
              {t("auth.create_account")}
            </Link>
          </p>
        </form>
      </div>
    </>
  );
}
