import { supabase } from "@/integrations/supabase/client";

/**
 * Billing Service — Credit-Based Economy (Industrial V4.0)
 *
 * Mirrors the Lovable credit-purchase model:
 *   1. User selects a credit plan (defined in `plans` table).
 *   2. Stripe Checkout creates a session → redirects user.
 *   3. Webhook confirms payment → credits are added via RPC.
 *   4. All movements logged in `transactions`.
 *
 * Note: Stripe integration uses Supabase Edge Functions for
 * server-side operations (checkout session, webhook validation).
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CreditPlan {
  id: string;
  name: string;
  price_id: string;          // Stripe price ID
  credits_amount: number;
  price_display: string;     // e.g. "$9.99"
  description: string | null;
  popular?: boolean;
}

export interface Invoice {
  id: string;
  user_id: string;
  stripe_invoice_id: string;
  amount: number;
  credits_awarded: number;
  status: 'paid' | 'pending' | 'failed';
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'purchase' | 'spend' | 'admin_grant' | 'admin_deduct' | 'refund';
  amount: number;
  description: string;
  created_at: string;
}

// ─── Credit Plans (static until DB table is populated) ──────────────────────
// These mirror Lovable's credit tiers

export const CREDIT_PLANS: CreditPlan[] = [
  {
    id: 'plan_starter',
    name: 'Starter',
    price_id: 'price_starter_placeholder',
    credits_amount: 100,
    price_display: '$9',
    description: 'Ideal para probar. 100 créditos para generación de código, imágenes y más.',
  },
  {
    id: 'plan_creator',
    name: 'Creator',
    price_id: 'price_creator_placeholder',
    credits_amount: 500,
    price_display: '$29',
    description: 'Para creadores activos. 500 créditos con los mejores modelos de IA.',
    popular: true,
  },
  {
    id: 'plan_pro',
    name: 'Pro',
    price_id: 'price_pro_placeholder',
    credits_amount: 2000,
    price_display: '$79',
    description: 'Para equipos y agencias. 2,000 créditos, prioridad en generación.',
  },
  {
    id: 'plan_business',
    name: 'Business',
    price_id: 'price_business_placeholder',
    credits_amount: 10000,
    price_display: '$249',
    description: 'Para empresas. 10,000 créditos, soporte dedicado y SLA garantizado.',
  },
];

// ─── Stripe Service (DEPRECATED: Migrated to PayU Latam) ────────────────────
export const stripeService = {
  async createCheckout() { throw new Error("Deprecated in favor of PayU"); },
  async buyCredits() { throw new Error("Deprecated in favor of PayU"); },
  async checkSubscription() { throw new Error("Deprecated in favor of PayU"); },
  async openPortal() { throw new Error("Deprecated in favor of PayU"); },
  async purchasePlan() { throw new Error("Deprecated in favor of PayU"); }
};

// ─── Credit Operations (via Supabase RPCs) ──────────────────────────────────

export const creditService = {
  /**
   * Get the current user's credit balance.
   */
  async getBalance(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data } = await supabase
      .from("profiles")
      .select("credits_balance")
      .eq("user_id", user.id)
      .single();

    return data?.credits_balance ?? 0;
  },

  /**
   * Spend credits for an action.
   */
  async spend(amount: number, action: string, model: string, nodeId?: string | null) {
    const { error } = await (supabase.rpc as any)("spend_credits", {
      _amount: amount,
      _action: action,
      _model: model,
      _node_id: nodeId || null,
    });
    if (error) throw new Error(error.message || "No se pudieron deducir los créditos");
  },

  /**
   * Refund credits after a failed operation.
   */
  async refund(amount: number, userId: string) {
    await (supabase.rpc as any)("refund_credits", {
      _amount: amount,
      _user_id: userId,
    });
  },

  /**
   * Get recent transactions for the current user.
   */
  async getTransactions(limit = 20): Promise<Transaction[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Billing] Error fetching transactions:', error);
      return [];
    }
    return (data || []) as Transaction[];
  },

  /**
   * Get invoices for the current user.
   */
  async getInvoices(limit = 20): Promise<Invoice[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await (supabase as any)
      .from("invoices")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Billing] Error fetching invoices:', error);
      return [];
    }
    return (data || []) as Invoice[];
  },
};

// ─── Admin Service ──────────────────────────────────────────────────────────

export const adminService = {
  /**
   * Save platform settings (e.g., Stripe keys).
   */
  async saveSettings(settings: Record<string, string>) {
    const { data, error } = await supabase.functions.invoke("admin-save-settings", {
      body: { settings },
    });
    if (error) throw error;
    return data;
  },

  /**
   * Admin: Add credits to a user.
   */
  async addCredits(targetUserId: string, amount: number, reason?: string) {
    const { data, error } = await (supabase.rpc as any)("admin_add_credits", {
      _target_user_id: targetUserId,
      _amount: amount,
      _reason: reason || 'Admin grant',
    });
    if (error) throw error;
    return data;
  },

  /**
   * Admin: Deduct credits from a user.
   */
  async deductCredits(targetUserId: string, amount: number, reason?: string) {
    const { data, error } = await (supabase.rpc as any)("admin_deduct_credits", {
      _target_user_id: targetUserId,
      _amount: amount,
      _reason: reason || 'Admin deduction',
    });
    if (error) throw error;
    return data;
  },

  /**
   * Admin: Refund credits to a user.
   */
  async refundCredits(targetUserId: string, amount: number, reason?: string) {
    const { data, error } = await (supabase.rpc as any)("admin_refund_credits", {
      _target_user_id: targetUserId,
      _amount: amount,
      _reason: reason || 'Admin refund',
    });
    if (error) throw error;
    return data;
  },

  /**
   * Admin: List all plans in the database.
   */
  async listPlans(): Promise<CreditPlan[]> {
    const { data, error } = await (supabase as any)
      .from("plans")
      .select("*")
      .order("credits_amount", { ascending: true });

    if (error || !data || data.length === 0) {
      // Fallback to static plans if DB table is empty or missing
      return CREDIT_PLANS;
    }
    return data as CreditPlan[];
  },

  /**
   * Admin: Create a new credit plan.
   */
  async createPlan(plan: Omit<CreditPlan, 'id'>) {
    const { data, error } = await (supabase as any)
      .from("plans")
      .insert(plan as any)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Admin: Get all invoices (all users).
   */
  async getAllInvoices(limit = 50): Promise<Invoice[]> {
    const { data, error } = await (supabase as any)
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Admin] Error fetching invoices:', error);
      return [];
    }
    return (data || []) as Invoice[];
  },
};
