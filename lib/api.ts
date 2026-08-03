export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001/api"
).replace(/\/$/, "");

export const API_BASE_URL = API_URL.endsWith("/api")
  ? API_URL.slice(0, -4)
  : API_URL;

export async function getApiError(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const payload = await response.json();
    if (typeof payload.detail === "string") return payload.detail;
  } catch {
    // The fallback below is more useful than a JSON parsing error.
  }
  return fallback;
}

export function resolveApiAssetUrl(baseUrl: string, value?: string): string | undefined {
  if (!value) return undefined;
  if (/^https?:\/\//.test(value)) return value;
  return `${baseUrl}${value}`;
}
