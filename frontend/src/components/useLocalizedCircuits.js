"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { resolveText } from "@/lib/localize";
import { useT } from "./LanguageProvider";

// Traductions déjà obtenues (partagées entre toutes les pages)
const memo = new Map();
const pending = new Set();

function key(from, to, text) {
  return `${from}|${to}|${text}`;
}

// Remplace title/description de chaque circuit par la version dans la
// langue courante. Les textes manquants sont traduits en arrière-plan
// (le texte d'origine reste affiché le temps de la traduction).
export default function useLocalizedCircuits(circuits) {
  const { lang } = useT();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    circuits.forEach((c) => {
      [
        resolveText(c.title_i18n, c.title, lang),
        resolveText(c.description_i18n, c.description, lang),
      ].forEach((r) => {
        if (!r.translateFrom) return;

        const k = key(r.translateFrom, lang, r.text);

        if (memo.has(k) || pending.has(k)) return;

        pending.add(k);

        api
          .post("/translate", {
            text: r.text,
            source: r.translateFrom,
            target: lang,
          })
          .then((res) => memo.set(k, res.text))
          .catch(() => memo.set(k, r.text))
          .finally(() => {
            pending.delete(k);
            setTick((n) => n + 1);
          });
      });
    });
  }, [circuits, lang]);

  return useMemo(() => {
    function pick(i18n, fallback) {
      const r = resolveText(i18n, fallback, lang);

      if (!r.translateFrom) return r.text;

      return memo.get(key(r.translateFrom, lang, r.text)) ?? r.text;
    }

    return circuits.map((c) => ({
      ...c,
      title: pick(c.title_i18n, c.title),
      description: pick(c.description_i18n, c.description),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [circuits, lang, tick]);
}
