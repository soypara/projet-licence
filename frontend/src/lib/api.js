import { supabase } from "./supabase";

const ENV_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Depuis un téléphone, "localhost" désigne le téléphone lui-même.
// Si le site est ouvert via l'adresse du PC (ex. 192.168.1.126), on
// utilise cette même adresse pour joindre le backend.
function resolveApiUrl() {
  if (typeof window === "undefined") return ENV_API_URL;

  try {
    const url = new URL(ENV_API_URL);
    const local = ["localhost", "127.0.0.1"];

    if (local.includes(url.hostname) && !local.includes(window.location.hostname)) {
      url.hostname = window.location.hostname;
      return url.toString().replace(/\/$/, "");
    }
  } catch {
    // URL invalide : on garde la valeur d'origine
  }

  return ENV_API_URL;
}

export const API_URL = resolveApiUrl();

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(options.headers || {});

  if (!isFormData) {
    headers.set("Content-Type", "application/json");
  }

  if (session?.access_token) {
    headers.set(
      "Authorization",
      `Bearer ${session.access_token}`
    );
  }

  let res;

  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    const networkError = new Error("network");
    networkError.code = "network";
    throw networkError;
  }

  if (!res.ok) {
    let message = `Erreur ${res.status}`;

    try {
      const data = await res.json();
      message = data.message || message;
    } catch {
      // pas de corps JSON
    }

    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) return null;

  return res.json();
}

export const api = {
  get: (path) => request(path),

  post: (path, body) =>
    request(path, {
      method: "POST",
      body:
        body instanceof FormData
          ? body
          : JSON.stringify(body),
    }),

  put: (path, body) =>
    request(path, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  del: (path) =>
    request(path, {
      method: "DELETE",
    }),
};
