"use client";

import { useRef } from "react";

import { useT } from "@/components/LanguageProvider";

// ============================================================
// SAISIE AUTOMATIQUE SIMULÉE (mode test seulement)
// ------------------------------------------------------------
// Les vrais navigateurs remplissent seuls la carte (numéro, date, CVC, nom)
// à partir des cartes enregistrées par la personne : pour cela, les champs de
// PaymentModal portent déjà les attributs autoComplete (cc-number, cc-exp,
// cc-csc, cc-name). Mais le navigateur ne propose rien sur une adresse locale
// (http://localhost, http://192.168...) : il faut du HTTPS.
// Ce bouton imite donc la saisie automatique : il "tape" une carte de test
// dans le formulaire, caractère par caractère.
//
// POUR L'ENLEVER (le jour où on a le vrai paiement) :
//   1. supprimer ce fichier ;
//   2. dans PaymentModal.jsx, supprimer l'import de TestCardAutofill et la
//      ligne <TestCardAutofill ... />.
// Rien d'autre ne dépend de lui.
// ============================================================

const TEST_CARD = "4242424242424242";

function nextYearShort() {
  return String((new Date().getFullYear() + 3) % 100).padStart(2, "0");
}

// fields : { setCard, setExpiry, setCvc, setHolder } (valeurs brutes, le
// formulaire les met en forme comme si la personne tapait)
export default function TestCardAutofill({ holder, fields }) {
  const { t } = useT();
  const busy = useRef(false);

  function typeInto(setter, text, delay = 28) {
    return new Promise((resolve) => {
      let i = 0;

      const step = () => {
        i += 1;
        setter(text.slice(0, i));

        if (i < text.length) {
          setTimeout(step, delay);
        } else {
          resolve();
        }
      };

      setter("");
      setTimeout(step, delay);
    });
  }

  async function fill() {
    if (busy.current) return;
    busy.current = true;

    await typeInto(fields.setCard, TEST_CARD);
    await typeInto(fields.setExpiry, `12${nextYearShort()}`);
    await typeInto(fields.setCvc, "123");
    await typeInto(fields.setHolder, holder || "TEST CARD");

    busy.current = false;
  }

  return (
    <button
      type="button"
      onClick={fill}
      className="text-xs font-medium text-or-clair underline underline-offset-4 hover:text-white"
    >
      {t("pay.autofill")}
    </button>
  );
}
