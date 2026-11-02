import { supabase } from "./supabase";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

async function request(path, options = {}) {
  const isFormData =
    options.body instanceof FormData;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(
    options.headers || {}
  );

  if (!isFormData) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  if (session?.access_token) {
    headers.set(
      "Authorization",
      `Bearer ${session.access_token}`
    );
  }

  let res;

  try {
    res = await fetch(
      `${API_URL}${path}`,
      {
        ...options,
        headers,
      }
    );
  } catch {
    throw new Error(
      "Impossible de contacter le serveur."
    );
  }

  if (!res.ok) {
    let message =
      `Erreur ${res.status}`;

    try {
      const data = await res.json();
      message =
        data.message || message;
    } catch {}

    throw new Error(message);
  }

  if (res.status === 204) {
    return null;
  }

  return res.json();
}

export const api = {
  get: (path) =>
    request(path),

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
