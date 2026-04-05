import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminUser } from "../types";

export function useAdminData(isAdmin: boolean) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    setLoadError(null);
    const { data, error } = await supabase.rpc("admin_list_users");
    if (error) {
      setLoadError(error.message || "No se pudo cargar la lista de usuarios.");
    } else {
      setUsers((data as AdminUser[]) || []);
    }
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
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const sevenDaysAgo  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000).toISOString();
      const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

      const [txRes, newUsersRes] = await Promise.all([
        supabase.from("transactions").select("amount, type, description, created_at")
          .gte("created_at", thirtyDaysAgo)
          .not("type", "in", '("subscription_reload","credit_purchase")'),
        supabase.from("profiles").select("id", { count: "exact", head: true })
          .gte("created_at", sevenDaysAgo),
      ]);

      const txs = txRes.data || [];
      let totalSpend = 0;
      let image = 0, video = 0, text = 0, canvas = 0, studio = 0;
      const dayMap: Record<string, { name: string; credits: number }> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        dayMap[d.toDateString()] = { name: DAY_LABELS[d.getDay()], credits: 0 };
      }
      txs.forEach((tx: any) => {
        const abs = Math.abs(tx.amount || 0);
        totalSpend += abs;
        const desc = (tx.description || "").toLowerCase();
        if (desc.includes("image") || desc.includes("imagen") || desc.includes("logo")) image++;
        else if (desc.includes("video")) video++;
        else if (desc.includes("studio") || desc.includes("code") || desc.includes("builderai")) studio++;
        else if (desc.includes("canvas") || desc.includes("formarketing")) canvas++;
        else text++;
        const key = new Date(tx.created_at).toDateString();
        if (dayMap[key]) dayMap[key].credits += abs;
      });

      setData({
        totalSpend,
        recentUsers: newUsersRes.count || 0,
        toolUsage: [
          { name: "Imagen IA",   count: image,  color: "#A855F7" },
          { name: "Texto / Copy",count: text,   color: "#60A5FA" },
          { name: "Video",       count: video,  color: "#F59E0B" },
          { name: "BuilderAI",   count: studio, color: "#A855F7" },
          { name: "Canvas",      count: canvas, color: "#EC4899" },
        ],
        dailyCredits: Object.values(dayMap),
      });
    } catch (e) {
      console.error("Analytics error:", e);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (activeTab === "analytics") fetchAnalytics();
  }, [activeTab, fetchAnalytics]);

  return { data, loading, refresh: fetchAnalytics };
}
