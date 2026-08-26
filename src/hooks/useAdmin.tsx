import { useProfile } from "./useProfile";

// El rol de admin ahora vive como columna en `profile` (ver db/schema/auth.ts)
// en vez de una RPC `has_role` separada — una sola fuente de verdad, sin
// round-trip extra.
export function useAdmin(userId: string | undefined) {
  const { profile, loading } = useProfile(userId);
  return { isAdmin: !!profile?.isAdmin, loading };
}
