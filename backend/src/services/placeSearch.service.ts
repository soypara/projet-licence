import {
  searchWikipedia,
  getWikipediaSummary,
  getWikipediaImages,
  WikiImage,
} from "./wikipedia.service";

import { searchNominatim } from "./nominatim.service";

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function searchPlace(query: string) {
  const [wikipedia, osm] = await Promise.all([
    searchWikipedia(query),
    searchNominatim(query),
  ]);

  // Garde uniquement les résultats situés à Madagascar.
  // Et on privilégie les résultats touristiques.
  const uniqueOsm = osm
    .filter(
      (place) =>
        place.address?.country_code === "mg"
    )
    .filter((place, index, array) => {
      const normalizedCurrent = normalizeName(
        place.name || place.display_name
      );

      const duplicateIndex = array.findIndex((other) => {
        const normalizedOther = normalizeName(
          other.name || other.display_name
        );

        return normalizedCurrent === normalizedOther;
      });

      if (duplicateIndex === index) {
        return true;
      }

      const duplicate = array[duplicateIndex];

      if (
        duplicate.category === "tourism" &&
        place.category !== "tourism"
      ) {
        return false;
      }

      if (
        place.category === "tourism" &&
        duplicate.category !== "tourism"
      ) {
        return true;
      }

      return false;
    });

  const results = await Promise.all(
    uniqueOsm.map(async (place) => {
      const placeName = normalizeName(
        place.name || place.display_name
      );

      // Wikipédia uniquement si le nom correspond
      // exactement après normalisation.
      const wikiMatch = wikipedia.find((wiki) => {
        const wikiName = normalizeName(wiki.title);

        return wikiName === placeName;
      });

      let wikipediaSummary = null;
      let wikipediaImages: WikiImage[] = [];

      if (wikiMatch) {
        wikipediaSummary = await getWikipediaSummary(
          wikiMatch.title
        );

        wikipediaImages = await getWikipediaImages(
          wikiMatch.title
        );
      }

      return {
        name: place.name || place.display_name,
        latitude: Number(place.lat),
        longitude: Number(place.lon),
        address: place.display_name,
        type: place.type,
        category: place.category,
        osmId: place.osm_id,
        osmType: place.osm_type,
        wikipedia: wikipediaSummary,
        images: wikipediaImages,
      };
    })
  );

  return {
    query,
    results,
  };
}