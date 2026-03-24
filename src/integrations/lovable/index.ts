// Auth integrations — usando Supabase OAuth nativo (sin Lovable)
import { supabase } from "../supabase/client";

type SignInOptions = {
  redirect_uri?: string;
};

/**
 * OAuth sign-in usando la API nativa de Supabase Auth.
 * Compatible con Google y Apple (cuando se configuren en el Supabase Dashboard).
 */
export const auth = {
  signInWithOAuth: async (provider: "google" | "apple", opts?: SignInOptions) => {
    const redirectTo = opts?.redirect_uri || `${window.location.origin}/dashboard`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) return { error };
    return { data };
  },
};
