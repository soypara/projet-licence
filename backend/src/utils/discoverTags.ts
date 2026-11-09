// Catégories des lieux + vocabulaire multilingue pour comprendre une recherche.
//
// >>> Pour ajouter un mot : ajoute-le dans SYNONYMS (en minuscules, sans accent).
// >>> Mots courts (3 lettres ou moins) : doivent être EXACTEMENT le mot tapé.
// >>> Mots plus longs : le mot tapé peut commencer par eux (plage -> plages).
// >>> Écritures non latines (chinois, arabe...) et expressions avec espace :
// >>> trouvées n'importe où dans la phrase.

export const TAGS = [
  "beach",
  "waterfall",
  "mountain",
  "park",
  "forest",
  "hiking",
  "wildlife",
  "culture",
  "city",
  "family",
  "calm",
  "water_sports",
] as const;

export type Tag = (typeof TAGS)[number];

export const SYNONYMS: Record<Tag, string[]> = {
  beach: [
    "plage", "balneaire", "bord de mer", "sable", "mer", "ile", "iles", "ocean", "cote",
    "beach", "seaside", "sea", "sand", "island", "islands", "coast",
    "morontsiraka", "ranomasina", "nosy",
    "playa", "mar", "isla", "costa", "strand", "meer", "insel", "kuste",
    "spiaggia", "mare", "isola", "praia", "ilha", "litus", "insula",
    "海滩", "沙滩", "海边", "大海", "海岛", "岛", "ビーチ", "海", "砂浜", "島", "海岸",
    "해변", "바다", "해안", "섬", "비치", "пляж", "море", "побережье", "остров",
    "شاطئ", "شواطئ", "بحر", "ساحل", "جزيرة", "समुद्र तट", "समुद्र", "बीच", "द्वीप",
    "plaj", "deniz", "sahil", "ada",
  ],
  waterfall: [
    "cascade", "chute d'eau", "chutes", "waterfall", "falls", "riana", "cascada", "wasserfall",
    "cascata", "cachoeira", "queda", "cataracta",
    "瀑布", "滝", "폭포", "водопад", "شلال", "झरना", "selale",
  ],
  mountain: [
    "montagne", "massif", "sommet", "hauts plateaux", "mountain", "peak", "summit", "highlands",
    "tendrombohitra", "montana", "berg", "gebirge", "montagna", "montanha", "mons", "montes",
    "山", "山岳", "산", "гора", "горы", "جبل", "جبال", "पहाड़", "पर्वत", "dag",
  ],
  park: [
    "parc", "reserve", "nature", "naturel", "naturels", "naturelle", "national park", "park", "natural",
    "parque", "naturaleza", "nationalpark", "natur", "parco", "natura", "riserva", "natureza",
    "公园", "国家公园", "自然", "保护区", "公園", "国立公園", "保護区", "공원", "국립공원", "자연", "보호구역",
    "парк", "заповедник", "природа", "حديقة", "محمية", "طبيعة", "पार्क", "उद्यान", "प्रकृति", "अभयारण्य",
    "milli park", "doga", "rezerv",
  ],
  forest: [
    "foret", "jungle", "rainforest", "forest", "woods", "ala", "bosque", "selva", "wald", "dschungel",
    "foresta", "giungla", "floresta", "mata", "silva", "森林", "丛林", "雨林", "森", "ジャングル", "熱帯雨林",
    "숲", "정글", "열대우림", "лес", "джунгли", "غابة", "غابات", "जंगल", "वन", "orman",
  ],
  hiking: [
    "randonnee", "rando", "trek", "trekking", "balade", "sentier", "hike", "hiking", "walk", "trail",
    "senderismo", "caminata", "wandern", "wanderung", "escursione", "passeggiata", "trilha", "caminhada",
    "徒步", "远足", "登山", "ハイキング", "トレッキング", "등산", "하이킹", "트레킹", "поход", "трекинг",
    "تسلق", "رحلة مشي", "ट्रेकिंग", "पैदल", "yuruyus",
  ],
  wildlife: [
    "lemurien", "lemur", "lemurs", "faune", "animaux", "oiseaux", "baleine", "chameleon",
    "wildlife", "animals", "birds", "whale", "varika", "gidro", "sifaka", "fauna", "camaleon",
    "lemuren", "tiere", "wale", "animali", "balene", "animais", "baleias",
    "狐猴", "动物", "野生动物", "鲸", "キツネザル", "野生動物", "動物", "クジラ", "여우원숭이", "야생동물", "동물", "고래",
    "лемур", "лемуры", "животные", "дикая природа", "киты", "ليمور", "حيوانات", "الحياة البرية", "حيتان",
    "लीमर", "जानवर", "वन्यजीव", "व्हेल", "hayvan", "yaban hayati", "balina",
  ],
  culture: [
    "culture", "histoire", "historique", "patrimoine", "musee", "temple", "village", "tradition",
    "traditionnel", "architecture", "palais", "history", "historical", "heritage", "museum", "palace",
    "kolontsaina", "tantara", "cultura", "historia", "museo", "kultur", "geschichte", "storia", "museu",
    "文化", "历史", "博物馆", "歴史", "博物館", "문화", "역사", "박물관", "культура", "история", "музей",
    "ثقافة", "تاريخ", "متحف", "संस्कृति", "इतिहास", "संग्रहालय", "tarih", "muze",
  ],
  city: [
    "ville", "capitale", "urbain", "city", "town", "capital", "urban", "ciudad", "stadt", "hauptstadt",
    "citta", "cidade", "urbs", "城市", "都市", "도시", "город", "مدينة", "शहर", "sehir",
  ],
  family: [
    "famille", "familial", "enfant", "enfants", "family", "kids", "children", "child", "fianakaviana",
    "ankizy", "familia", "ninos", "familie", "kinder", "famiglia", "bambini", "criancas",
    "家庭", "家人", "亲子", "孩子", "家族", "子供", "가족", "아이", "아이들", "семья", "дети", "с детьми",
    "عائلة", "أطفال", "परिवार", "बच्चे", "aile", "cocuk",
  ],
  calm: [
    "calme", "tranquille", "paisible", "repos", "relax", "detente", "ressourcer", "peaceful", "quiet",
    "calm", "relaxing", "milamina", "tranquilo", "ruhig", "entspannung", "tranquillo", "sereno", "calmo",
    "quies", "placidus", "安静", "宁静", "放松", "静か", "のんびり", "リラックス", "조용", "평화", "휴식", "힐링",
    "спокойный", "тихий", "отдых", "هادئ", "هدوء", "استرخاء", "शांत", "आराम", "sakin", "huzur",
  ],
  water_sports: [
    "plongee", "snorkeling", "snorkel", "surf", "kitesurf", "kayak", "voile", "nautique", "diving",
    "dive", "sailing", "boat", "surfing", "buceo", "tauchen", "immersione", "mergulho",
    "潜水", "ダイビング", "다이빙", "дайвинг", "غوص", "गोताखोरी", "dalis",
  ],
};

// Mois cités dans une phrase (sans accent). Valeur = numéro du mois.
export const MONTH_WORDS: Record<string, number> = {
  janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7, aout: 8,
  septembre: 9, octobre: 10, novembre: 11, decembre: 12,
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8,
  september: 9, october: 10, november: 11, december: 12,
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8,
  septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
  januar: 1, februar: 2, marz: 3, juni: 6, juli: 7, oktober: 10, dezember: 12,
  gennaio: 1, febbraio: 2, aprile: 4, maggio: 5, giugno: 6, luglio: 7, settembre: 9, ottobre: 10, dicembre: 12,
  janeiro: 1, fevereiro: 2, marco: 3, maio: 5, junho: 6, julho: 7, setembro: 9, outubro: 10, dezembro: 12,
};

// Mots trop courants pour servir de mot-clé libre
const STOPWORDS = new Set([
  "veux", "voudrais", "decouvrir", "cherche", "endroit", "endroits", "faire", "avec", "dans", "belle",
  "belles", "beau", "beaux", "pour", "propose", "moi", "idees", "idee", "madagascar", "visiter", "voir",
  "want", "would", "like", "looking", "some", "with", "place", "places", "visit", "find", "show", "ideas",
  "where", "about", "that", "have", "very", "good", "best", "nice", "great", "trip", "voyage", "sejour",
  "quiero", "busco", "lugar", "lugares", "quiero", "suchen", "mochte", "möchte", "ort", "orte",
  "dans", "des", "les", "une", "pas", "quel", "quelle", "autour",
]);

export type Interpretation = {
  tags: Tag[];
  month: number | null;
  words: string[]; // mots libres (sans accent) à chercher dans les noms et descriptions
};

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

const NON_LATIN = /[^\u0000-ɏ]/; // chinois, arabe, hindi, cyrillique, coréen...

function hasSynonym(text: string, tokens: string[], syn: string): boolean {
  const word = normalize(syn);

  if (word.includes(" ") || NON_LATIN.test(word)) return text.includes(word);

  if (word.length <= 3) return tokens.includes(word);

  return tokens.some((t) => t.startsWith(word));
}

// Comprend la phrase et la transforme en critères de recherche.
// >>> C'est la SEULE fonction à remplacer le jour où on branche un modèle de
// >>> langage : elle doit renvoyer la même forme { tags, month, words }.
export function interpretQuery(query: string): Interpretation {
  const text = normalize(query);
  const tokens = text.split(/[^\p{L}\p{N}']+/u).filter(Boolean);

  const tags = TAGS.filter((tag) =>
    SYNONYMS[tag].some((syn) => hasSynonym(text, tokens, syn))
  );

  let month: number | null = null;

  for (const token of tokens) {
    if (MONTH_WORDS[token]) {
      month = MONTH_WORDS[token];
      break;
    }
  }

  // Mots libres : ceux que le vocabulaire n'explique pas
  const used = new Set<string>();

  tokens.forEach((token) => {
    for (const tag of tags) {
      if (SYNONYMS[tag].some((syn) => hasSynonym(token, [token], syn))) {
        used.add(token);
      }
    }
  });

  const words = tokens.filter(
    (t) =>
      t.length >= 4 &&
      !used.has(t) &&
      !STOPWORDS.has(t) &&
      !MONTH_WORDS[t] &&
      !/^\d+$/.test(t) &&
      !NON_LATIN.test(t)
  );

  return { tags, month, words };
}
