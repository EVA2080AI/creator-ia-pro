import { supabase } from "@/integrations/supabase/client";
import { CREDIT_PACKS } from "@/lib/credit-packs";

/**
 * Billing Service — Credit-Based Economy (Industrial V4.0)
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
  bold_payment_id?: string; 
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

// ─── Credit Plans (Synchronized with Pricing.tsx) ───────────────────────────
export const CREDIT_PLANS: CreditPlan[] = [
  {
    id: 'basico',
    name: 'Aether Protocol',
    price_id: 'basico',
    credits_amount: 1000,
    price_display: '$149.900',
    description: 'Cimiente industrial para arquitectos individuales.',
  },
  {
    id: 'profesional',
    name: 'Nodal Architect',
    price_id: 'profesional',
    credits_amount: 3000,
    price_display: '$349.900',
    description: 'Orquestación de alta fidelidad y dominios soberanos.',
    popular: true,
  },
  {
    id: 'empresarial',
    name: 'Sovereign Swarm',
    price_id: 'empresarial',
    credits_amount: 8000,
    price_display: '$699.900',
    description: 'Soberanía total para flotas de ingeniería autónoma.',
  },
];

// ─── Bold Service ──────────────────────────────────────────────────────────
export const boldService = {
  async purchaseCredits(packOrPlanId: string) {
    const item = CREDIT_PACKS.find(p => p.id === packOrPlanId) || 
                 CREDIT_PLANS.find(p => p.id === packOrPlanId);
    
    if (!item) throw new Error("Producto no encontrado");

    const rawPrice = (item as any).price_display || (item as any).price || "0";
    const amountStr = rawPrice.replace(/[^0-9]/g, "");
    const amount = parseInt(amountStr, 10);

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) throw new Error("Usuario no autenticado");

    const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>("bold-checkout", {
      body: { 
        amount, 
        packId: item.id,
        userId: authData.user.id,
        buyerEmail: authData.user.email,
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
  async getBalance(): Promise<number> {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return 0;

    const { data } = await supabase
      .from("profiles")
      .select("credits_balance")
      .eq("user_id", authData.user.id)
      .single();

    return data?.credits_balance ?? 0;
  },

  async spend(amount: number, action: string, model: string, nodeId?: string | null) {
    const { error } = await (supabase as any).rpc("spend_credits", {
      _amount: amount,
      _action: action,
      _model: model,
      _node_id: nodeId || null,
    });
    if (error) throw new Error(error.message || "No se pudieron deducir los créditos");
  },

  async refund(amount: number, userId: string) {
    await (supabase as any).rpc("refund_credits", {
      _amount: amount,
      _user_id: userId,
    });
  },

  async getTransactions(limit = 20): Promise<Transaction[]> {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return [];

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", authData.user.id)
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
  async addCredits(targetUserId: string, amount: number, reason?: string) {
    const { data, error } = await (supabase as any).rpc("admin_add_credits", {
      _target_user_id: targetUserId,
      _amount: amount,
      _reason: reason || 'Admin grant',
    });
    if (error) throw error;
    return data;
  },

  async deductCredits(targetUserId: string, amount: number, reason?: string) {
    const { data, error } = await (supabase as any).rpc("admin_deduct_credits", {
      _target_user_id: targetUserId,
      _amount: amount,
      _reason: reason || 'Admin deduction',
    });
    if (error) throw error;
    return data;
  },

  async refundCredits(targetUserId: string, amount: number, reason?: string) {
    const { data, error } = await (supabase as any).rpc("admin_refund_credits", {
      _target_user_id: targetUserId,
      _amount: amount,
      _reason: reason || 'Admin refund',
    });
    if (error) throw error;
    return data;
  },

  async listPlans(): Promise<CreditPlan[]> {
    const { data, error } = await (supabase as any)
      .from("plans")
      .select("*")
      .order("credits_amount", { ascending: true });

    if (error || !data || data.length === 0) {
      return CREDIT_PLANS;
    }
    return (data as any) as CreditPlan[];
  },

  async saveSettings(settings: Record<string, string>) {
    const { data, error } = await supabase.functions.invoke("admin-save-settings", {
      body: settings,
    });
    if (error) throw error;
    return data;
  },
};
