import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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

class ProfileError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

// La sesión de better-auth vive en una cookie httpOnly — no hace falta
// adjuntar token, basta con enviar la cookie de origen (same-origin).
//
// Lanza en vez de devolver null a propósito: ahora que la respuesta se cachea,
// un 401 pasajero durante el login quedaría congelado como "este usuario no
// tiene perfil" durante todo el staleTime.
async function fetchProfile(): Promise<Profile> {
  const res = await fetch("/api/profile", { credentials: "include" });
  if (!res.ok) throw new ProfileError(`Error ${res.status}`, res.status);
  const json = await res.json();
  if (!json.ok) throw new ProfileError(json.error ?? "Respuesta inesperada", res.status);
  return withLegacyAliases(json.profile as ProfileApiShape);
}

/** El userId va DENTRO de la clave: sin él, cambiar de cuenta en la misma pestaña
 *  serviría desde caché el plan y los créditos de la sesión anterior. */
export const profileQueryKey = (userId?: string) => ["profile", userId] as const;

/**
 * El perfil lo piden ocho componentes (sidebars, useAdmin, Dashboard, Arena…).
 * Antes cada uno hacía su propio fetch sin caché: en una carga de Basalt se
 * medieron TRES llamadas a /api/profile (338, 618 y 814 ms). Con react-query
 * —que ya estaba instalado y con su provider montado en App.tsx, pero sin usar—
 * los ocho comparten una sola entrada.
 */
export function useProfile(userId: string | undefined) {
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery({
    queryKey: profileQueryKey(userId),
    queryFn: fetchProfile,
    enabled: !!userId,
    // Lo que de verdad colapsa las tres llamadas: los componentes se montan
    // escalonados (son lazy), así que react-query solo deduplica las que
    // coinciden en vuelo; sin staleTime seguirían siendo tres.
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: (count, error) => (error as ProfileError).status !== 401 && count < 2,
  });

  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    // invalidate (y no setQueryData) porque Tools.tsx y ShareScreen.tsx hacen
    // `await refreshProfile()` y leen los créditos justo después: tiene que
    // resolver cuando el dato nuevo ya está.
    await queryClient.invalidateQueries({ queryKey: profileQueryKey(userId), exact: true });
  }, [queryClient, userId]);

  return {
    profile: data ?? null,
    // Con `enabled:false` react-query deja el estado en "pending" para siempre.
    // Sin este guard, las páginas públicas que esperan a `loading` (/product-backlog,
    // Canvas, Estatus) se quedarían con el spinner eterno para un visitante sin sesión.
    loading: !!userId && isPending,
    refreshProfile,
  };
}
