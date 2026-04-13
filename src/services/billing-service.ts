import { supabase } from "@/integrations/supabase/client";
import { CREDIT_PACKS } from "@/lib/credit-packs";
import type { PostgrestResponse } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type CreditPack = (typeof CREDIT_PACKS)[number];

// ─── Custom Types for Missing RPCs ──────────────────────────────────────────
type SupabaseCustom = {
  rpc: <T = unknown>(name: string, args: Record<string, unknown>) => Promise<PostgrestResponse<T>>;
  from: (table: string) => ReturnType<typeof supabase.from>; 
} & typeof supabase;

const sb = (supabase as unknown) as SupabaseCustom;

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
    id: 'creador',
    name: 'Creador',
    price_id: 'creador',
    credits_amount: 1000,
    price_display: '$149.900',
    description: 'Todo lo que necesitas para empezar a crear contenido con IA.',
  },
  {
    id: 'pro',
    name: 'Pro',
    price_id: 'pro',
    credits_amount: 3000,
    price_display: '$349.900',
    description: 'Para creadores que publican a diario y quieren más potencia.',
    popular: true,
  },
  {
    id: 'agencia',
    name: 'Agencia',
    price_id: 'agencia',
    credits_amount: 8000,
    price_display: '$699.900',
    description: 'Ideal para agencias y equipos que crean contenido en escala.',
  },
  {
    id: 'pyme',
    name: 'Pyme',
    price_id: 'pyme',
    credits_amount: 20000,
    price_display: '$1.499.900',
    description: 'Para negocios que necesitan IA a escala sin límites.',
  },
];

// ─── Bold Service ──────────────────────────────────────────────────────────
export const boldService = {
  async purchaseCredits(packOrPlanId: string) {
    const item = (CREDIT_PACKS.find(p => p.id === packOrPlanId) || 
                  CREDIT_PLANS.find(p => p.id === packOrPlanId)) as CreditPack | CreditPlan | undefined;
    
    if (!item) throw new Error("Producto no encontrado");

    const rawPrice = 'price_display' in item ? item.price_display : (item as CreditPack).price || "0";
    const amountStr = rawPrice.replace(/[^0-9]/g, "");
    const amount = parseInt(amountStr, 10);

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) throw new Error("Usuario no autenticado");

    const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string; linkId?: string }>("bold-checkout", {
      body: {
        packId: item.id,
        userId: authData.user.id,
        buyerEmail: authData.user.email,
        description: `Creator IA Pro: ${item.name}`
      },
    });

    if (error) {
      console.error("[Bold Checkout Error]", error);
      // Parse edge function error for user-friendly message
      const msg = typeof error === 'object' && 'message' in error
        ? (error as any).message
        : String(error);
      if (msg.includes('BOLD_API_KEY')) {
        throw new Error("Pasarela de pagos no configurada. Contacta soporte.");
      }
      throw new Error(msg || "Error al conectar con Bold. Intenta de nuevo.");
    }

    if (!data) throw new Error("Sin respuesta del servidor de pagos.");
    if (data.error) throw new Error(data.error);

    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error("No se pudo generar el link de pago. Intenta de nuevo.");
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
    const { error } = await sb.rpc("spend_credits", {
      _amount: amount,
      _action: action,
      _model: model,
      _node_id: nodeId || null,
    });
    if (error) throw new Error(error.message || "No se pudieron deducir los créditos");
  },

  async refund(amount: number, userId: string) {
    await sb.rpc("refund_credits", {
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
    const { data, error } = await sb.rpc("admin_add_credits", {
      _target_user_id: targetUserId,
      _amount: amount,
      _reason: reason || 'Admin grant',
    });
    if (error) throw error;
    return data;
  },

  async deductCredits(targetUserId: string, amount: number, reason?: string) {
    const { data, error } = await sb.rpc("admin_deduct_credits", {
      _target_user_id: targetUserId,
      _amount: amount,
      _reason: reason || 'Admin deduction',
    });
    if (error) throw error;
    return data;
  },

  async refundCredits(targetUserId: string, amount: number, reason?: string) {
    const { data, error } = await sb.rpc("admin_refund_credits", {
      _target_user_id: targetUserId,
      _amount: amount,
      _reason: reason || 'Admin refund',
    });
    if (error) throw error;
    return data;
  },

  async listPlans(): Promise<CreditPlan[]> {
    try {
      const { data, error } = await sb
        .from("plans")
        .select("*")
        .order("credits_amount", { ascending: true });

      if (error || !data || (data as any[]).length === 0) {
        return CREDIT_PLANS;
      }
      return data as unknown as CreditPlan[];
    } catch (e) {
      console.warn("[Billing] Plans table not available, using defaults.");
      return CREDIT_PLANS;
    }
  },

  async saveSettings(key: string, value: string) {
    const { data, error } = await supabase.functions.invoke("admin-save-settings", {
      body: { key, value },
    });
    if (error) throw error;
    return data;
  },

  async getSettings(): Promise<Record<string, string>> {
    const { data, error } = await supabase
      .from("app_settings")
      .select("key, value");

    if (error) {
      console.warn("[Admin] Could not fetch settings directly, might be restricted.");
      return {};
    }

    const settings: Record<string, string> = {};
    data?.forEach(item => {
      try {
        settings[item.key] = JSON.parse(item.value);
      } catch {
        settings[item.key] = item.value;
      }
    });
    return settings;
  },
};
