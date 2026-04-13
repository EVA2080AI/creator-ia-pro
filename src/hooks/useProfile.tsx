import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  full_name: string | null;
  email: string;
  credits_balance: number;
  subscription_tier: string;
  avatar_url: string | null;
  condominio_id: string | null;
  telefono: string | null;
}

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!error && data) {
        setProfile(data as any as Profile);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [userId]);

  const refreshProfile = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (data) setProfile(data as any as Profile);
  };

  return { profile, loading, refreshProfile };
}
