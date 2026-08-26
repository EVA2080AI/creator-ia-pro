import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : undefined,
  plugins: [organizationClient()],
});

// better-auth 1.7 no resuelve el tipo de `useSession().data` bajo
// moduleResolution:"bundler" (colapsa a `never`, reproducido incluso en el
// caso mínimo sin plugins). Se declara a mano la forma real, verificada
// contra la respuesta en vivo de /api/auth/get-session.
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
  emailVerified: boolean;
}

export interface AuthSession {
  user: AuthUser;
  session: { id: string; token: string; expiresAt: string; activeOrganizationId: string | null };
}

export function useSession(): { data: AuthSession | null; isPending: boolean } {
  const result = authClient.useSession() as unknown as { data: AuthSession | null; isPending: boolean };
  return result;
}

export const { signIn, signUp, signOut } = authClient;
