"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Compte les visites pour les statistiques de l'admin :
// une ligne par page vue, avec un identifiant anonyme du visiteur
// (gardé dans son navigateur) et, s'il est connecté, son compte.
// Rien n'est compté dans l'admin. Aucune donnée personnelle n'est envoyée.
const VISITOR_KEY = "visitorId";
const SESSION_KEY = "visitSession";

function visitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);

    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }

    return id;
  } catch {
    return null;
  }
}

// Première page de la session : lien tapé / favori ("direct") ou venu d'ailleurs
function entrySource() {
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return null;

    sessionStorage.setItem(SESSION_KEY, "1");

    return document.referrer ? "referral" : "direct";
  } catch {
    return null;
  }
}

export default function VisitTracker() {
  const pathname = usePathname();
  const last = useRef("");

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    if (last.current === pathname) return;

    last.current = pathname;

    const id = visitorId();

    if (!id) return;

    const source = entrySource();

    supabase.auth
      .getSession()
      .then(({ data }) =>
        supabase.from("site_visits").insert({
          visitor_id: id,
          user_id: data.session?.user?.id ?? null,
          path: pathname,
          source,
        })
      )
      .catch(() => {
        // les statistiques ne doivent jamais gêner le visiteur
      });
  }, [pathname]);

  return null;
}
