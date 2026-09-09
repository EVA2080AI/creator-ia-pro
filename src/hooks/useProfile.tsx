import { useCallback, useEffect, useState } from "react";

interface ProfileApiShape {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  email: string;
  creditsBalance: number;
  subscriptionTier: string;
  subscriptionExpiresAt: string | null;
  isAdmin: boolean;
  createdAt: string;
}

// Alias en snake_case por compatibilidad con los componentes que aún no se
// migraron (SidebarGlobal, MobileNav, Dashboard...) — mismo valor, dos nombres,
// hasta que cada consumidor pase a los campos camelCase de `ProfileApiShape`.
export interface Profile extends ProfileApiShape {
  display_name: string | null;
  avatar_url: string | null;
  credits_balance: number;
  subscription_tier: string;
  created_at: string;
  full_name: string | null;
}

function withLegacyAliases(p: ProfileApiShape): Profile {
  return {
    ...p,
    display_name: p.displayName,
    avatar_url: p.avatarUrl,
    credits_balance: p.creditsBalance,
    subscription_tier: p.subscriptionTier,
    created_at: p.createdAt,
    full_name: p.displayName,
  };
}

// La sesión de better-auth vive en una cookie httpOnly — no hace falta
// adjuntar token, basta con enviar la cookie de origen (same-origin).
async function fetchProfile(): Promise<Profile | null> {
  const res = await fetch("/api/profile", { credentials: "include" });
  if (!res.ok) return null;
  const json = await res.json();
  return json.ok ? withLegacyAliases(json.profile as ProfileApiShape) : null;
}

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    const p = await fetchProfile();
    if (p) setProfile(p);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchProfile().then((p) => {
      setProfile(p);
      setLoading(false);
    });
  }, [userId]);

  return { profile, loading, refreshProfile };
}
