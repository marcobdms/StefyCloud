/**
 * Lee el JWT del cookie del navegador y devuelve los headers de Authorization.
 * Para usar en todos los hooks que hacen fetch al backend.
 */
export function getAuthHeaders(): Record<string, string> {
  if (typeof document === "undefined") return {};
  const match = document.cookie.match(/(?:^|; )access_token=([^;]*)/);
  const token = match ? decodeURIComponent(match[1]) : "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}
