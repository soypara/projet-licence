"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, getCurrentRole } from "@/lib/auth";

export default function TestAuth() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    async function load() {
      setUser(await getCurrentUser());
      setRole(await getCurrentRole());
    }

    load();
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Test Auth</h1>

      <p className="mt-4">
        Email : {user?.email || "Non connecté"}
      </p>

      <p>
        Rôle : {role || "Chargement..."}
      </p>
    </main>
  );
}