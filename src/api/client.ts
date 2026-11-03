// STUB of the shared API client (Frontend Intern 1 owns the real one).
// If Frontend 1 has already pushed `api/client.ts`, keep THEIR file and just make sure it exports
// `api`, `USE_MOCK` and `getErrorMessage` (or adjust the imports in my api/*.ts files).
import axios from "axios";

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Pulls the backend's error message out of any thrown error. */
export function getErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
