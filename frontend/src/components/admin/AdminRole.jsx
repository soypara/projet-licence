"use client";

import { createContext, useContext } from "react";

// Rôle de la personne connectée dans l'administration
// ("super_admin" = Admin, "admin" = Employé).
const AdminRoleContext = createContext("");

export const AdminRoleProvider = AdminRoleContext.Provider;

export function useAdminRole() {
  return useContext(AdminRoleContext);
}
