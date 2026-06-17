// Helpers de cliente para llamar a la API.
"use client";

export async function api<T = any>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Error de red");
  return data as T;
}

export function post<T = any>(url: string, body: unknown): Promise<T> {
  return api<T>(url, { method: "POST", body: JSON.stringify(body) });
}

export function del<T = any>(url: string): Promise<T> {
  return api<T>(url, { method: "DELETE" });
}
