// Noms affichés des rôles. En base, les valeurs ne changent pas :
//   super_admin -> affiché "Admin"      (gère aussi l'argent de l'agence)
//   admin       -> affiché "Employé"    (réservations, circuits, planning)
export const ROLE_LABEL = {
  super_admin: "Admin",
  admin: "Employé",
};

export function roleLabel(role) {
  return ROLE_LABEL[role] || "";
}

export function isSuperAdmin(role) {
  return role === "super_admin";
}
