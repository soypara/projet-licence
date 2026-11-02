"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TestAuthBackend() {
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function test() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setResult({ error: "Aucune session Supabase." });
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/place-search/import",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            name: "Allée des Baobabs",
            description:
              "L’allée des baobabs ou avenue des baobabs est un groupe de baobabs dans la région de Menabe à Madagascar.",
            latitude: -20.2503296,
            longitude: 44.4192658,
            source_url:
              "https://fr.wikipedia.org/wiki/All%C3%A9e_des_baobabs",
          }),
        }
      );

      const data = await response.json();

      setResult({
        status: response.status,
        data,
      });
    }

    test();
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Test Import Backend</h1>

      <pre className="mt-4 rounded bg-gray-100 p-4">
        {JSON.stringify(result, null, 2)}
      </pre>
    </main>
  );
}