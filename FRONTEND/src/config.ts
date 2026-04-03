/** Base URL for FastAPI (browser hits host port 8000 when Compose publishes it). */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000";
