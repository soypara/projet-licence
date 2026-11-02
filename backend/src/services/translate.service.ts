import { TranslateInput } from "../schemas/translate.schema";

// Traduction automatique via MyMemory (gratuit, sans clé, ~5 000 caractères/jour
// par adresse). Le résultat est gardé en mémoire pour ne pas redemander
// la même traduction. Pour changer de fournisseur : modifier translateChunk().
const cache = new Map<string, string>();

const MAX_CHUNK = 450; // MyMemory refuse les textes trop longs

function splitIntoChunks(text: string): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + " " + sentence).trim().length > MAX_CHUNK && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = (current + " " + sentence).trim();
    }
  }

  if (current) chunks.push(current.trim());

  // Phrase unique trop longue : découpe brute
  return chunks.flatMap((chunk) =>
    chunk.length > MAX_CHUNK
      ? chunk.match(new RegExp(`.{1,${MAX_CHUNK}}`, "g")) || [chunk]
      : [chunk]
  );
}

async function translateChunk(
  chunk: string,
  source: string,
  target: string
): Promise<string> {
  const url =
    "https://api.mymemory.translated.net/get?q=" +
    encodeURIComponent(chunk) +
    `&langpair=${source === "auto" ? "Autodetect" : source}|${target}`;

  const response = await fetch(url);

  if (!response.ok) throw new Error(`Traduction indisponible (${response.status})`);

  const json = (await response.json()) as {
    responseStatus?: number | string;
    responseData?: { translatedText?: string };
  };

  const translated = json.responseData?.translatedText;

  if (Number(json.responseStatus) !== 200 || !translated) {
    throw new Error("Traduction indisponible.");
  }

  return translated;
}

export async function translate(input: TranslateInput) {
  if (input.source === input.target) {
    return { text: input.text, translated: false };
  }

  const key = `${input.source}|${input.target}|${input.text}`;
  const cached = cache.get(key);

  if (cached) return { text: cached, translated: true };

  try {
    const parts: string[] = [];

    for (const chunk of splitIntoChunks(input.text)) {
      parts.push(await translateChunk(chunk, input.source, input.target));
    }

    const text = parts.join(" ");

    cache.set(key, text);

    return { text, translated: true };
  } catch {
    // En cas d'échec, on rend le texte d'origine : le site reste lisible
    return { text: input.text, translated: false };
  }
}
