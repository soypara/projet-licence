"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./AdminTheme";
import { useAdminRole } from "./AdminRole";
import { AdminLanguageSwitcher, useAT } from "./AdminLanguage";
import { isSuperAdmin } from "@/lib/roles";

const LINKS = [
  { key: "a.nav.dashboard", href: "/admin" },
  { key: "a.nav.planning", href: "/admin/planning" },
  { key: "a.nav.reservations", href: "/admin/reservations" },
  { key: "a.nav.circuits", href: "/admin/circuits" },
  { key: "a.nav.places", href: "/admin/places" },
  { key: "a.nav.comments", href: "/admin/comments" },
  // Argent de l'agence : réservé à l'Admin (super_admin)
  { key: "a.nav.finances", href: "/admin/finances", superOnly: true },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const role = useAdminRole();
  const { ta } = useAT();
  const links = LINKS.filter((l) => !l.superOnly || isSuperAdmin(role));

  function isActive(href) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname?.startsWith(href + "/");
  }

  return (
    <>
      {/* Navigation mobile */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900 lg:hidden">
        <div className="flex items-baseline gap-2 px-4 py-3">
          <h1 className="font-sans text-base font-semibold text-slate-50">
            Madagascar Tour
          </h1>
          <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
            {ta(`a.role.${role || "super_admin"}`)}
          </span>
          <Link
            href="/"
            className="adm-btn-ghost ml-auto !px-2 !py-1 !text-xs"
          >
            {ta("a.nav.see_site")}
          </Link>
          <ThemeToggle className="!px-2 !py-1 !text-xs" />
          <AdminLanguageSwitcher className="!w-auto !px-1 !py-1 !text-xs" />
        </div>

        <nav className="flex gap-1 overflow-x-auto border-t border-slate-800 px-3 py-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium ${
                isActive(link.href)
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {ta(link.key)}
            </Link>
          ))}
        </nav>
      </header>

      {/* Navigation desktop */}
      <aside className="fixed start-0 top-0 hidden h-screen w-64 border-e border-slate-800 bg-slate-900 p-5 lg:block">
        <div className="mb-8">
          <h1 className="font-sans text-lg font-semibold text-slate-50">
            Madagascar Tour
          </h1>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            {role ? ta(`a.role.${role}`) : ta("a.nav.administration")}
          </p>
        </div>

        <nav className="space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {ta(link.key)}
            </Link>
          ))}
        </nav>

        <Link href="/" className="adm-btn mt-6 w-full">
          ← {ta("a.nav.back_site")}
        </Link>

        <ThemeToggle className="mt-3 w-full" />

        <label className="mt-4 block text-xs text-slate-400">
          {ta("a.lang.label")}
          <AdminLanguageSwitcher className="mt-1 w-full" />
        </label>

      </aside>
    </>
  );
}
