import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionInfo {
  subscribed: boolean;
  tier: string;
  credits: number;
  subscription_end: string | null;
}

export function useSubscription(userId: string | undefined) {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const checkSubscription = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) {
        // Non-2xx is expected when no Stripe customer exists
        console.log("check-subscription: no active subscription or error");
        setSubscription({ subscribed: false, tier: "free", credits: 0, subscription_end: null });
      } else if (data) {
        setSubscription({
          subscribed: data.subscribed ?? false,
          tier: data.tier ?? "free",
          credits: data.credits ?? 0,
          subscription_end: data.subscription_end ?? null,
        });
      }
    } catch (err) {
      console.error("check-subscription error:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    checkSubscription();
  }, [userId, checkSubscription]);

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      console.error("customer-portal error:", err);
      throw err;
    }
  };

  return { subscription, loading, checkSubscription, openCustomerPortal };
}
