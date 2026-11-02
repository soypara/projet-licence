"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";
import { getCurrentRole, signOut } from "../lib/auth";
import { useT } from "./LanguageProvider";
import { CurrencySwitcher } from "./CurrencyProvider";
import LanguageSwitcher from "./LanguageSwitcher";

function Icon({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const links = [
  {
    id: "circuits",
    href: "/#circuits",
    labelKey: "nav.circuits",
    icon: (
      <Icon>
        <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" />
        <path d="M9 4v14M15 6v14" />
      </Icon>
    ),
  },
  {
    id: "reserve",
    href: "/#reserve",
    labelKey: "nav.reserve",
    icon: (
      <Icon>
        <rect x="3" y="5" width="18" height="16" rx="2.5" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </Icon>
    ),
  },
  {
    id: "discover",
    href: "/#discover",
    labelKey: "nav.discover",
    icon: (
      <Icon>
        <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </Icon>
    ),
  },
  {
    id: "contact",
    href: "/#contact",
    labelKey: "nav.contact",
    icon: (
      <Icon>
        <path d="M4 5h16v12H8l-4 4z" />
        <path d="M8 10h8M8 13h5" />
      </Icon>
    ),
  },
];

export default function Nav() {
  const pathname = usePathname();
  const { t } = useT();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [section, setSection] = useState("");

  // Onglet actif = section visible à l'écran (page d'accueil)
  useEffect(() => {
    if (pathname !== "/") return;

    const sections = links
      .map((l) => document.getElementById(l.id))
      .filter(Boolean);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) setSection(visible.target.id);
      },
      { rootMargin: "-30% 0px -50% 0px", threshold: [0, 0.2, 0.5] }
    );

    sections.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [pathname]);

  function isActive(l) {
    if (pathname === "/") return section === l.id;
    if (l.id === "reserve") return pathname?.startsWith("/reserve");
    return l.id === "discover" && pathname?.startsWith("/feed");
  }

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

  useEffect(() => {
    let active = true;

    if (!user) {
      setRole(null);
      return;
    }

    getCurrentRole().then((r) => {
      if (active) setRole(r);
    });

    return () => {
      active = false;
    };
  }, [user]);

  const isAdmin = role === "admin" || role === "super_admin";

  // L'admin a sa propre barre latérale : on n'affiche pas la navigation publique
  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      {/* Barre du haut : marque + liens (liens visibles à partir de la tablette) */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-emeraude-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="font-serif text-lg font-semibold text-white"
          >
            Madagascar <span className="text-or-clair">Tour</span>
          </Link>

          <nav className="hidden gap-1 sm:flex">
            {links.map((l) => {
              const active = isActive(l);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-or text-emeraude-950"
                      : "text-white/80 hover:bg-white/10"
                  }`}
                >
                  {t(l.labelKey)}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <CurrencySwitcher />
            <LanguageSwitcher />
            {isAdmin && (
              <Link
                href="/admin"
                className="rounded-full border border-white/25 px-3 py-1 text-xs font-medium text-white/90 hover:bg-white/10"
              >
                {t("nav.admin")}
              </Link>
            )}
            {user ? (
              <>
              <Link
                href="/account"
                aria-label={t("account.title")}
                title={t("account.title")}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-emeraude-700 text-xs font-bold uppercase text-white"
              >
                {(user.email || "?").charAt(0)}
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className="rounded-full border border-white/25 px-3 py-1 text-xs font-medium text-white/90 hover:bg-white/10"
              >
                {t("nav.logout")}
              </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-or px-3 py-1 text-xs font-semibold text-emeraude-950"
              >
                {t("nav.login")}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Barre du bas : mobile uniquement */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-emeraude-950/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden">
        <ul className="grid grid-cols-4">
          {links.map((l) => {
            const active = isActive(l);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                    active ? "text-or-clair" : "text-white/70"
                  }`}
                >
                  {l.icon}
                  {t(l.labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
