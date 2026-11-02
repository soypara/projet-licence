"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

import { getCurrentUser, getCurrentRole } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { AdminLanguageProvider, useAT } from "@/components/admin/AdminLanguage";
import { AdminRoleProvider } from "@/components/admin/AdminRole";
import { AdminThemeProvider } from "@/components/admin/AdminTheme";
import BackArrow from "@/components/BackArrow";

function AdminLayoutInner({ children }) {
  const { ta, dir } = useAT();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");

  useEffect(() => {
    async function checkAccess() {
      const user = await getCurrentUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const role = await getCurrentRole();

      if (role !== "admin" && role !== "super_admin") {
        router.replace("/");
        return;
      }

      setRole(role);
      setLoading(false);
    }

    checkAccess();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <p className="text-sm text-slate-400">{ta("a.layout.checking")}</p>
      </main>
    );
  }

  // Flèche de retour sur TOUTES les pages : une page de détail revient à sa
  // liste, les pages principales au dashboard, et le dashboard au site.
  const parts = (pathname || "").split("/").filter(Boolean);
  const backHref =
    parts.length > 2
      ? `/${parts.slice(0, -1).join("/")}`
      : parts.length === 2
      ? "/admin"
      : "/";

  return (
    <AdminThemeProvider>
      <AdminRoleProvider value={role}>
      <div dir={dir} className="min-h-screen bg-slate-950 text-slate-200">
        <AdminSidebar />

        <main className="min-h-screen p-4 sm:p-6 lg:ms-64 lg:p-8">
          <div className="mx-auto mb-4 max-w-6xl">
            <BackArrow href={backHref} variant="admin" />
          </div>

          {children}
        </main>
      </div>
      </AdminRoleProvider>
    </AdminThemeProvider>
  );
}

// La langue de l'admin est indépendante de celle du site client
export default function AdminLayout({ children }) {
  return (
    <AdminLanguageProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminLanguageProvider>
  );
}
