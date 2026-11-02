// Circuit à reprendre après la connexion (mémorisé quand on clique
// sur "Réserver" sans être connecté).
export const PENDING_KEY = "pendingCircuit";

export function rememberCircuit(id) {
  try {
    sessionStorage.setItem(PENDING_KEY, id);
  } catch {
    // stockage indisponible
  }
}

// Lit (et efface) le circuit mémorisé.
export function takePendingCircuit() {
  try {
    const id = sessionStorage.getItem(PENDING_KEY);
    if (id) sessionStorage.removeItem(PENDING_KEY);
    return id || "";
  } catch {
    return "";
  }
}

// Où aller après la connexion : la page de réservation si un circuit attend.
export function afterLoginPath() {
  try {
    return sessionStorage.getItem(PENDING_KEY) ? "/reserve" : "/";
  } catch {
    return "/";
  }
}
