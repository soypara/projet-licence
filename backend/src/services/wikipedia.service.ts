import { AppError } from "../middlewares/errorHandler";

const WIKI_LANG = "fr";

// Bonne pratique demandée par Wikimedia pour les appels serveur-à-serveur :
// s'identifier plutôt que d'envoyer une requête anonyme.
const USER_AGENT =
  "PlateformeAgenceVoyageMadagascar/1.0 (projet-licence-ENI)";

export interface WikiSearchResult {
  title: string;
  snippet: string;
}

export async function searchWikipedia(
  query: string
): Promise<WikiSearchResult[]> {
  const url = `https://${WIKI_LANG}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    query
  )}&srlimit=5&format=json&origin=*`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
    },
  });

  if (!res.ok) {
    throw new AppError("Impossible de contacter Wikipédia.", 502);
  }

  const data = (await res.json()) as {
    query?: {
      search?: Array<{
        title: string;
        snippet: string;
      }>;
    };
  };

  return (data.query?.search || []).map(
    (r: { title: string; snippet: string }) => ({
      title: r.title,
      snippet: r.snippet.replace(/<[^>]+>/g, ""),
    })
  );
}

export interface WikiSummary {
  title: string;
  description: string;
  thumbnailUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  sourceUrl: string;
}

export async function getWikipediaSummary(
  title: string
): Promise<WikiSummary> {
  const url = `https://${WIKI_LANG}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    title
  )}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
    },
  });

  if (!res.ok) {
    throw new AppError("Page Wikipédia introuvable.", 404);
  }

  const data = (await res.json()) as {
    title?: string;
    extract?: string;
    thumbnail?: {
      source?: string;
    };
    originalimage?: {
      source?: string;
    };
    coordinates?: {
      lat?: number;
      lon?: number;
    };
    content_urls?: {
      desktop?: {
        page?: string;
      };
    };
  };

  return {
    title: data.title || title,
    description: data.extract || "",
    thumbnailUrl:
      data.thumbnail?.source ||
      data.originalimage?.source ||
      null,
    latitude: data.coordinates?.lat ?? null,
    longitude: data.coordinates?.lon ?? null,
    sourceUrl:
      data.content_urls?.desktop?.page ||
      `https://${WIKI_LANG}.wikipedia.org/wiki/${encodeURIComponent(
        title
      )}`,
  };
}

export interface WikiImage {
  url: string;
  title: string;
  descriptionUrl: string | null;
  author: string | null;
  license: string | null;
}

export async function getWikipediaImages(
  title: string
): Promise<WikiImage[]> {
  const url =
    `https://${WIKI_LANG}.wikipedia.org/w/api.php?` +
    new URLSearchParams({
      action: "query",
      prop: "images",
      titles: title,
      imlimit: "10",
      format: "json",
      origin: "*",
    }).toString();

  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new AppError(
      "Impossible de récupérer les images Wikipédia.",
      502
    );
  }

  const data = (await res.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          images?: Array<{
            title: string;
          }>;
        }
      >;
    };
  };

  const pages = data.query?.pages || {};
  const page = Object.values(pages)[0];
  const images = page?.images || [];

  // On garde uniquement les formats d'images classiques.
  // Cela élimine notamment les SVG utilisés pour les icônes,
  // logos techniques, boutons, etc.
  const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
  ];

  const photoImages = images.filter((image) => {
    const imageTitle = image.title.toLowerCase();

    return allowedExtensions.some((extension) =>
      imageTitle.endsWith(extension)
    );
  });

  const results = await Promise.all(
    photoImages.map(async (image) => {
      const infoUrl =
        `https://${WIKI_LANG}.wikipedia.org/w/api.php?` +
        new URLSearchParams({
          action: "query",
          prop: "imageinfo",
          titles: image.title,
          iiprop: "url|extmetadata",
          iiurlwidth: "1200",
          format: "json",
          origin: "*",
        }).toString();

      const infoRes = await fetch(infoUrl, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json",
        },
      });

      if (!infoRes.ok) {
        return null;
      }

      const infoData = (await infoRes.json()) as {
        query?: {
          pages?: Record<
            string,
            {
              imageinfo?: Array<{
                thumburl?: string;
                url?: string;
                descriptionurl?: string;
                extmetadata?: {
                  Artist?: {
                    value?: string;
                  };
                  LicenseShortName?: {
                    value?: string;
                  };
                };
              }>;
            }
          >;
        };
      };

      const infoPages = infoData.query?.pages || {};
      const infoPage = Object.values(infoPages)[0];
      const info = infoPage?.imageinfo?.[0];

      if (!info) {
        return null;
      }

      return {
        url: info.thumburl || info.url || "",
        title: image.title.replace(/^File:/, ""),
        descriptionUrl: info.descriptionurl || null,
        author:
          info.extmetadata?.Artist?.value || null,
        license:
          info.extmetadata?.LicenseShortName?.value || null,
      };
    })
  );

  return results.filter(
    (image): image is WikiImage =>
      image !== null && image.url.length > 0
  );
}