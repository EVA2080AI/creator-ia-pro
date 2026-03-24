import { supabase } from "@/integrations/supabase/client";

/**
 * Stripe Service (Industrial V3.4)
 * Consolidates all billing logic previously managed by Edge Functions.
 * Note: These calls still point to Supabase Functions but are ready for redirection
 * to a centralized "Creator Ecosystem" API.
 */
export const stripeService = {
  async createCheckout(priceId: string) {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { priceId }
    });
    if (error) throw error;
    return data;
  },

  async buyCredits(priceId: string) {
    const { data, error } = await supabase.functions.invoke("buy-credits", {
      body: { priceId }
    });
    if (error) throw error;
    return data;
  },

  async checkSubscription() {
    const { data, error } = await supabase.functions.invoke("check-subscription");
    if (error) throw error;
    return data;
  },

  async openPortal() {
    const { data, error } = await supabase.functions.invoke("customer-portal");
    if (error) throw error;
    return data;
  }
};

/**
 * Admin Service (Industrial V3.4)
 */
export const adminService = {
  async saveSettings(settings: Record<string, string>) {
    const { data, error } = await supabase.functions.invoke("admin-save-settings", {
      body: { settings }
    });
    if (error) throw error;
    return data;
  }
};
