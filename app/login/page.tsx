"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Guarda el token como cookie en el dominio del frontend (Vercel)
function setAuthCookie(token: string) {
  const maxAge = 60 * 60 * 24 * 15; // 15 días
  document.cookie = `access_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax; Secure`;
}

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setDebugInfo("");
    setLoading(true);

    const loginUrl = `${API_URL}/auth/login`;
    console.log("[Login] URL:", loginUrl);
    setDebugInfo(`Conectando a: ${loginUrl}`);

    try {
      const res = await fetch(loginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      console.log("[Login] HTTP:", res.status);
      setDebugInfo(`HTTP ${res.status}`);

      if (res.ok) {
        const data = await res.json();
        // Guardamos el token en una cookie del dominio de Vercel
        setAuthCookie(data.token);
        console.log("[Login] Token guardado, redirigiendo...");
        router.replace("/dashboard");
      } else {
        let detail = "Error desconocido";
        try { detail = (await res.json()).detail; } catch { /* noop */ }
        console.error("[Login] Error:", detail);
        setDebugInfo(`Error ${res.status}: ${detail}`);
        setError("Contraseña incorrecta. Inténtalo de nuevo.");
        setPassword("");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Login] Red/CORS:", msg);
      setDebugInfo(`Error de red: ${msg}`);
      setError(`No se pudo conectar: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center justify-center px-6">
      <div className="mb-10 text-center">
        <div className="w-16 h-16 bg-[#0071e3] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Lock size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">Stefany Cloud</h1>
        <p className="text-sm text-[#6e6e73] mt-1">Introduce tu contraseña para continuar</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[360px] bg-white rounded-[24px] shadow-sm border border-[#e5e5ea] p-6 flex flex-col gap-4"
      >
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            autoFocus
            autoComplete="current-password"
            className="w-full bg-[#f5f5f7] rounded-[14px] px-4 py-3.5 pr-12 text-[16px] text-[#1d1d1f] placeholder:text-[#6e6e73] outline-none focus:ring-2 focus:ring-[#0071e3]/30 transition"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6e6e73] active:opacity-60"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {error && <p className="text-[13px] text-[#FF3B30] text-center -mt-1">{error}</p>}
        {debugInfo && (
          <p className="text-[11px] text-[#8e8e93] text-center font-mono break-all -mt-1">{debugInfo}</p>
        )}

        <button
          type="submit"
          disabled={!password || loading}
          className="w-full bg-[#0071e3] text-white rounded-[14px] py-3.5 text-[16px] font-semibold active:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-[10px] text-[#c7c7cc] text-center font-mono">API: {API_URL}</p>
      </form>
    </div>
  );
}
