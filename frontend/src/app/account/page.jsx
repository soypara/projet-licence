"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageBackground from "@/components/PageBackground";
import BackArrow from "@/components/BackArrow";
import { useT } from "@/components/LanguageProvider";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/lib/auth";

export default function AccountPage() {
  const { t } = useT();

  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setReady(true);
    });
  }, []);

  const providers = (user?.identities || []).map((i) => i.provider);
  const hasGoogle = providers.includes("google");
  const hasEmail = providers.includes("email");

  // Lier Google au compte actuel (choix facultatif de l'utilisateur)
  async function linkGoogle() {
    setError("");

    const { error } = await supabase.auth.linkIdentity({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/account` },
    });

    if (error) setError(t("account.link_error"));
  }

  return (
    <>
      <PageBackground name="login" />

      <div className="mx-auto max-w-lg space-y-5 py-6">
        <BackArrow href="/" />

        <h1 className="hero-title !text-4xl">{t("account.title")}</h1>

        {ready && !user && (
          <div className="glass space-y-4 p-6">
            <p className="text-white/85">{t("account.login_needed")}</p>
            <Link href="/login" className="btn-gold">
              {t("auth.login_btn")}
            </Link>
          </div>
        )}

        {user && (
          <>
            <section className="glass space-y-1 p-5">
              <p className="text-xs uppercase tracking-wide text-white/60">
                {t("account.email")}
              </p>
              <p className="break-all text-lg">{user.email}</p>
            </section>

            <section className="glass space-y-4 p-5">
              <p className="text-xs uppercase tracking-wide text-white/60">
                {t("account.methods")}
              </p>

              <ul className="space-y-2">
                {hasEmail && (
                  <li className="flex items-center justify-between">
                    <span>{t("account.method_email")}</span>
                    <span className="chip">{t("account.linked")}</span>
                  </li>
                )}

                <li className="flex items-center justify-between">
                  <span>{t("account.method_google")}</span>
                  {hasGoogle ? (
                    <span className="chip">{t("account.linked")}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={linkGoogle}
                      className="btn-glass !px-4 !py-2"
                    >
                      {t("account.link_google")}
                    </button>
                  )}
                </li>
              </ul>

              {!hasGoogle && (
                <p className="text-sm text-white/70">{t("account.link_hint")}</p>
              )}

              {error && (
                <p className="rounded-xl bg-red-500/20 p-3 text-sm text-red-100">
                  {error}
                </p>
              )}
            </section>

            <div className="flex flex-wrap gap-3">
              <Link href="/reserve" className="btn-gold">
                {t("account.my_bookings")}
              </Link>
              <button type="button" onClick={() => signOut()} className="btn-glass">
                {t("nav.logout")}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
