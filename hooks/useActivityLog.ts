"use client";

import { useCallback, useEffect, useState } from "react";
import type { ActivityLog } from "@/types";
import { fetchWithAuth } from "@/lib/auth";
import { API_URL, getApiError } from "@/lib/api";

export function useActivityLog(limit = 5) {
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/trash/activity?limit=${limit}`);
      if (!res.ok) throw new Error(await getApiError(res, "No se pudo cargar la actividad"));
      setActivity(await res.json());
    } catch (error) {
      console.error("Failed to fetch activity log:", error);
    } finally {
      setLoaded(true);
    }
  }, [limit]);

  useEffect(() => {
    void fetchActivity();
  }, [fetchActivity]);

  return { activity, loaded, refreshActivity: fetchActivity };
}
