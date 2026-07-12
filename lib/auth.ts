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

/**
 * Elimina la cookie del token y recarga la página para forzar el re-login.
 */
export function clearAuthCookie() {
  if (typeof document === "undefined") return;
  document.cookie = "access_token=; path=/; max-age=0; SameSite=Lax; Secure";
  window.location.href = "/login";
}

/**
 * Helper para peticiones Fetch que automáticamente hace logout si recibe un 401.
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = { ...options.headers, ...getAuthHeaders() };
  const res = await fetch(url, { ...options, headers });
  
  if (res.status === 401 || res.status === 403) {
    clearAuthCookie();
  }
  
  return res;
}
