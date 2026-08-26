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

    // El usuario y el precio se validan en el servidor a partir de la sesión de
    // better-auth — el cliente solo manda el id del pack (ver api/billing/checkout.ts).
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packId: item.id }),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.ok) {
      throw new Error(data?.error || "Error al conectar con Bold. Intenta de nuevo.");
    }
    if (!data.url) throw new Error("No se pudo generar el link de pago. Intenta de nuevo.");

    window.location.href = data.url;
  },
};

// ─── Credit Operations ───────────────────────────────────────────────────────
// El gasto/reembolso real ocurre atómicamente en el servidor dentro de cada
// endpoint de IA (api/ai/chat.ts, api/ai/image.ts) — aquí solo queda lectura.

export const creditService = {
  async getBalance(): Promise<number> {
    const res = await fetch("/api/profile", { credentials: "include" });
    if (!res.ok) return 0;
    const data = await res.json().catch(() => null);
    return data?.creditsBalance ?? 0;
  },

  async getTransactions(limit = 20): Promise<Transaction[]> {
    const res = await fetch(`/api/billing/transactions?limit=${limit}`, { credentials: "include" });
    if (!res.ok) return [];
    const data = await res.json().catch(() => null);
    return (data?.transactions ?? []) as Transaction[];
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
