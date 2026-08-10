/**
 * Base URL for the FastAPI backend.
 * - In production (Vercel), set `VITE_API_URL` to your Render backend URL.
 * - In local dev, it defaults to the local FastAPI server on port 8000.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000";
