import { AppError } from "../middlewares/errorHandler";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

const USER_AGENT =
  "PlateformeAgenceVoyageMadagascar/1.0 (projet-licence-ENI)";

export interface NominatimResult {
  place_id: number;
  osm_type: string;
  osm_id: number;
  name: string;
  display_name: string;
  lat: string;
  lon: string;
  category: string;
  type: string;
  importance: number;
  address: {
    tourism?: string;
    road?: string;
    village?: string;
    town?: string;
    city?: string;
    county?: string;
    state?: string;
    region?: string;
    country?: string;
    country_code?: string;
  };
}

export async function searchNominatim(
  query: string
): Promise<NominatimResult[]> {
  const url =
  `${NOMINATIM_URL}?` +
  new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "5",
    addressdetails: "1",
    countrycodes: "mg",
  }).toString();

  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new AppError(
      "Impossible de contacter OpenStreetMap.",
      502
    );
  }

  return (await res.json()) as NominatimResult[];
}