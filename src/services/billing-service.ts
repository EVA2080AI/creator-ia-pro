import { supabase } from "@/integrations/supabase/client";
import { CREDIT_PACKS } from "@/lib/credit-packs";

/**
 * Billing Service — Credit-Based Economy (Industrial V4.0)
 *
 * Integrated with Bold.co for Colombian payments.
 *   1. User selects a credit plan or pack.
 *   2. Bold Checkout generates a link via Edge Function.
 *   3. Webhook confirms payment → credits added via RPC.
 *   4. All movements logged in `public.transactions`.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CreditPlan {
  id: string;
  name: string;
  price_id: string;          // Maps to packId in backend
  credits_amount: number;
  price_display: string;     // e.g. "$69.000 COP"
  description: string | null;
  popular?: boolean;
}

export interface Invoice {
  id: string;
  user_id: string;
  bold_payment_id?: string; // Replaces stripe_invoice_id
  amount: number;
  credits_awarded: number;
  status: 'paid' | 'pending' | 'failed';
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'purchase' | 'spend' | 'admin_grant' | 'admin_deduct' | 'refund' | 'bold_pending' | 'bold_approved';
  amount: number;
  description: string;
  created_at: string;
}

// ─── Credit Plans (Synchronized with Pricing.tsx & User Request) ───────────
export const CREDIT_PLANS: CreditPlan[] = [
  {
    id: 'basico',
    name: 'Básico',
    price_id: 'basico',
    credits_amount: 1500,
    price_display: '$149.900',
    description: 'Perfecto para proyectos individuales y pequeñas marcas.',
  },
  {
    id: 'profesional',
    name: 'Profesional',
    price_id: 'profesional',
    credits_amount: 4000,
    price_display: '$349.900',
    description: 'La opción ideal para creadores de contenido profesionales.',
    popular: true,
  },
  {
    id: 'empresarial',
    name: 'Empresarial',
    price_id: 'empresarial',
    credits_amount: 10000,
    price_display: '$699.900',
    description: 'Poder total para agencias y empresas en crecimiento.',
  },
];

// ─── Bold Service ──────────────────────────────────────────────────────────
export const boldService = {
  /**
   * Initiate a Checkout flow to buy credits with Bold.co
   */
  async purchaseCredits(packOrPlanId: string) {
    // Look in credit packs first, then plans
    const item = CREDIT_PACKS.find(p => p.id === packOrPlanId) || 
                 CREDIT_PLANS.find(p => p.id === packOrPlanId);
    
    if (!item) throw new Error("Producto no encontrado");

    // Extract numerical COP integer from price string
    const rawPrice = (item as any).price_display || (item as any).price || "0";
    const amountStr = rawPrice.replace(/[^0-9]/g, "");
    const amount = parseInt(amountStr, 10);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuario no autenticado");

    const { data, error } = await supabase.functions.invoke("bold-checkout", {
      body: { 
        amount, 
        packId: item.id,
        userId: user.id,
        buyerEmail: user.email,
        description: `Creator IA Pro: ${item.name}`
      },
    });

    if (error || !data) {
      console.error("[Bold Checkout Error]", error);
      throw new Error(error?.message || "Error al conectar con Bold API");
    }

    if (data.error) throw new Error(data.error);

    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error("Respuesta inválida de Bold API");
    }
  },
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
};

// ─── Admin Service ──────────────────────────────────────────────────────────

export const adminService = {
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
      return CREDIT_PLANS;
    }
    return data as CreditPlan[];
  },

  /**
   * Admin: Save platform settings (e.g., Bold API keys).
   */
  async saveSettings(settings: Record<string, string>) {
    const { data, error } = await supabase.functions.invoke("admin-save-settings", {
      body: settings,
    });
    if (error) throw error;
    return data;
  },
};
