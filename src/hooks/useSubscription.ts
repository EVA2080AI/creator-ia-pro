import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionInfo {
  tier: string;
  credits: number;
}

export function useSubscription(userId: string | undefined) {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const checkSubscription = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("subscription_tier, credits_balance")
        .eq("user_id", userId)
        .single();

      if (error) throw error;

      if (data) {
        setSubscription({
          tier: data.subscription_tier ?? "free",
          credits: data.credits_balance ?? 0,
        });
      }
    } catch (err) {
      console.error("fetch-profile-subscription error:", err);
      setSubscription({ tier: "free", credits: 0 });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    checkSubscription();
  }, [userId, checkSubscription]);

  return { subscription, loading, checkSubscription };
}
