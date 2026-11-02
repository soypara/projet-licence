// Recherche de circuits : titre, description (toutes les langues) ET lieux
// traversés (nom + description de chaque étape). Sans accents ni majuscules :
// "baobab" trouve « Allée des Baobabs », "cote" trouve « côte ».

export function normalize(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

// Mots cherchés (1 lettre seule ignorée : trop de résultats inutiles)
export function tokensOf(query) {
  return normalize(query)
    .split(/[\s,;]+/)
    .filter((token) => token.length >= 2);
}

function circuitText(circuit) {
  return normalize(
    [
      circuit.title,
      circuit.description,
      ...Object.values(circuit.title_i18n || {}),
      ...Object.values(circuit.description_i18n || {}),
      ...(circuit.stops || []).flatMap((s) => [s.name, s.description]),
    ].join(" ")
  );
}

// Tous les mots doivent se retrouver quelque part dans le circuit
export function circuitMatches(circuit, query) {
  const tokens = tokensOf(query);

  if (tokens.length === 0) return true;

  const text = circuitText(circuit);

  return tokens.every((token) => text.includes(token));
}

// Lieux du circuit qui correspondent à la recherche (pour dire POURQUOI
// un circuit apparaît, quand son titre ne contient pas le mot)
export function matchedStops(circuit, query) {
  const tokens = tokensOf(query);

  if (tokens.length === 0) return [];

  const titleText = normalize(
    [circuit.title, ...Object.values(circuit.title_i18n || {})].join(" ")
  );

  // Titre déjà concerné : inutile d'ajouter une explication
  if (tokens.some((token) => titleText.includes(token))) return [];

  return (circuit.stops || [])
    .filter((stop) => {
      const text = normalize(`${stop.name} ${stop.description}`);

      return tokens.some((token) => text.includes(token));
    })
    .map((stop) => stop.name)
    .slice(0, 2);
}
