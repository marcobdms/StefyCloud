"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/auth";
import { getApiError } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let index = 0; index < rawData.length; index += 1) {
    output[index] = rawData.charCodeAt(index);
  }
  return output;
}

function isValidVapidPublicKey(value: string): boolean {
  try {
    const decoded = urlBase64ToUint8Array(value.trim());
    return decoded.length === 65 && decoded[0] === 4;
  } catch {
    return false;
  }
}

async function getVapidPublicKey(): Promise<string> {
  const response = await fetch(`${API_URL}/push/config`);
  if (!response.ok) {
    throw new Error(
      await getApiError(
        response,
        "Las notificaciones no están configuradas correctamente en el servidor",
      ),
    );
  }

  const payload: { publicKey?: string } = await response.json();
  const publicKey = payload.publicKey?.trim() ?? "";
  if (!isValidVapidPublicKey(publicKey)) {
    throw new Error("La clave pública de notificaciones del servidor no es válida");
  }
  return publicKey;
}

function isIosDevice(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isStandalone(): boolean {
  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    iosNavigator.standalone === true
  );
}

async function saveSubscription(subscription: PushSubscription): Promise<void> {
  const response = await fetchWithAuth(`${API_URL}/push/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });
  if (!response.ok) {
    throw new Error(
      await getApiError(response, "No se pudo registrar este dispositivo"),
    );
  }
}

export function usePushNotifications() {
  const [supported, setSupported] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requiresInstall, setRequiresInstall] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const inspectSubscription = async () => {
      const canUsePush =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;
      if (!canUsePush) {
        setSupported(false);
        setLoading(false);
        return;
      }

      const needsInstall = isIosDevice() && !isStandalone();
      setRequiresInstall(needsInstall);

      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const subscription = await registration.pushManager.getSubscription();
        const active =
          Notification.permission === "granted" && subscription !== null;
        setEnabled(active);
        if (active && subscription) await saveSubscription(subscription);
      } catch (inspectionError) {
        console.error("Failed to inspect push subscription:", inspectionError);
        setError("No se pudo comprobar el estado de las notificaciones");
      } finally {
        setLoading(false);
      }
    };

    inspectSubscription();
  }, []);

  const enable = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isIosDevice() && !isStandalone()) {
        setRequiresInstall(true);
        throw new Error("Abre Stefany Cloud desde el icono de la pantalla de inicio");
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const vapidPublicKey = await getVapidPublicKey();
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Activa el permiso de notificaciones en los ajustes del iPhone");
      }

      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        }));
      await saveSubscription(subscription);
      setEnabled(true);

      const testResponse = await fetchWithAuth(`${API_URL}/push/test`, {
        method: "POST",
      });
      if (!testResponse.ok) {
        setError(
          `Notificaciones activadas. ${await getApiError(
            testResponse,
            "No se pudo enviar la notificación de prueba",
          )}`,
        );
      }
    } catch (enableError) {
      console.error("Failed to enable push notifications:", enableError);
      setEnabled(false);
      setError(
        enableError instanceof Error
          ? enableError.message
          : "No se pudieron activar las notificaciones",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const response = await fetchWithAuth(`${API_URL}/push/unsubscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription.toJSON()),
        });
        if (!response.ok) {
          throw new Error(
            await getApiError(response, "No se pudo desactivar este dispositivo"),
          );
        }
        await subscription.unsubscribe();
      }
      setEnabled(false);
    } catch (disableError) {
      console.error("Failed to disable push notifications:", disableError);
      setError(
        disableError instanceof Error
          ? disableError.message
          : "No se pudieron desactivar las notificaciones",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    supported,
    enabled,
    loading,
    requiresInstall,
    error,
    clearError: () => setError(null),
    toggle: enabled ? disable : enable,
  };
}
