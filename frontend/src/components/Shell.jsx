"use client";

import { usePathname } from "next/navigation";

// Public : conteneur centré, marge basse pour la barre d'onglets mobile.
// Admin : pleine largeur (l'admin gère sa propre mise en page).
export default function Shell({ children }) {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return <main>{children}</main>;
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-4 sm:px-6 sm:pb-12 sm:pt-6">
      {children}
    </main>
  );
}
