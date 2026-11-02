// Filtre de mots pour les avis.
// Un avis est PUBLIÉ TOUT DE SUITE, sauf s'il contient un mot de cette liste :
// il passe alors "en attente" et un employé l'accepte ou le refuse
// (Admin > Commentaires).
//
// >>> Pour ajouter un mot : ajoute-le dans WORDS (mot entier, en minuscules,
// >>> sans accent). Pour attraper aussi ses variantes (merdique, merdeux...),
// >>> ajoute le début du mot dans STEMS.
// >>> Les mots malgaches ne sont pas inclus (je ne peux pas garantir qu'ils
// >>> soient justes) : ajoute-les ici avec l'aide de l'agence.

// Mots entiers
const WORDS = [
  // français
  "merde", "putain", "pute", "salope", "salaud", "connard", "connasse", "con",
  "encule", "enculer", "enculee", "batard", "batarde", "nique", "niquer", "fdp",
  "ntm", "pd", "tg", "foutre", "bordel", "chier", "chiant", "couille", "couilles",
  "bite", "cul", "branleur", "branler", "petasse", "pouffiasse", "ordure",
  "trouduc", "tarlouze", "gogol", "debile", "abruti", "cretin", "imbecile",
  // anglais
  "fuck", "fucking", "fucked", "fucker", "shit", "shitty", "bitch", "bastard",
  "asshole", "dick", "cunt", "slut", "whore", "wanker", "twat", "motherfucker",
  "bullshit", "nigger", "nigga", "faggot", "retard", "retarded", "moron", "idiot",
  "stupid", "dumbass", "pussy", "prick",
  // espagnol, portugais, italien, allemand
  "mierda", "puta", "puto", "cabron", "pendejo", "gilipollas", "coño", "joder",
  "merda", "caralho", "foda", "filhadaputa", "vaffanculo", "cazzo", "stronzo",
  "puttana", "scheisse", "scheise", "arschloch", "fotze", "hurensohn", "wichser",
];

// Débuts de mots (attrapent merdique, putains, enculé...)
const STEMS = ["merd", "putain", "encul", "connard", "salop", "fuck", "shit", "bullshit"];

const LEET: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  "$": "s",
  "!": "i",
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // accents
    .replace(/[01345 7@$!]/g, (c) => (c === " " ? " " : LEET[c] ?? c));
}

const WORD_SET = new Set(WORDS.map((w) => w.replace(/(.)\1+/g, "$1")));

function isBad(token: string): boolean {
  const collapsed = token.replace(/(.)\1+/g, "$1");

  return (
    WORD_SET.has(collapsed) ||
    WORD_SET.has(token) ||
    STEMS.some((stem) => collapsed.startsWith(stem))
  );
}

export function containsBadWords(text: string): boolean {
  const normalized = normalize(text);

  // 1) mot par mot (évite de bloquer "constitution" à cause de "con")
  const tokens = normalized.split(/[^a-z]+/).filter(Boolean);

  if (tokens.some(isBad)) return true;

  // 2) lettres séparées : "m.e.r.d.e", "f u c k", "p-u-t-e"
  const spread = normalized.match(/\b[a-z](?:[\s.\-_*]+[a-z]){2,}\b/g) || [];

  return spread.some((chunk) => isBad(chunk.replace(/[^a-z]/g, "")));
}
