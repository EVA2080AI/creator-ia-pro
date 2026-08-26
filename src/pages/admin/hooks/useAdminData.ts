import { useState, useCallback, useEffect } from "react";
import { AdminUser } from "../types";

async function api<T>(path: string, init?: RequestInit): Promise<{ ok: boolean; error?: string; data?: T }> {
  try {
    const res = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" }, ...init });
    const json = await res.json();
    if (!res.ok || !json.ok) return { ok: false, error: json.error || `Error ${res.status}` };
    return { ok: true, data: json };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error de red" };
  }
}

export function useAdminData(isAdmin: boolean) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    setLoadError(null);
    const res = await api<{ users: AdminUser[] }>("/api/admin/users");
    if (!res.ok) setLoadError(res.error || "No se pudo cargar la lista de usuarios.");
    else setUsers(res.data!.users || []);
    setLoadingUsers(false);
  }, [isAdmin]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loadingUsers, loadError, fetchUsers };
}

export function useAdminAnalytics(isAdmin: boolean, activeTab: string) {
  const [data, setData] = useState<{
    totalSpend: number;
    recentUsers: number;
    toolUsage: { name: string; count: number; color: string }[];
    dailyCredits: { name: string; credits: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    const res = await api<{ totalSpend: number; recentUsers: number; toolUsage: any[]; dailyCredits: any[] }>("/api/admin/stats");
    if (res.ok) setData(res.data!);
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    if (activeTab === "analytics") fetchAnalytics();
  }, [activeTab, fetchAnalytics]);

  return { data, loading, refresh: fetchAnalytics };
}
