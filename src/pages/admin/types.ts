export interface AdminUser {
  user_id: string;
  email: string;
  display_name: string | null;
  credits_balance: number;
  created_at: string;
  last_sign_in: string | null;
  subscription_tier: string;
  is_active: boolean;
  is_admin: boolean;
  // ── Uso real (GET /api/admin/users). Opcionales: si la consulta de actividad falla, el
  //    servidor igual devuelve la lista y estos campos no vienen.
  /** Lo último que hizo: entrar, escribir un mensaje, generar una imagen o gastar créditos. */
  last_active_at?: string | null;
  /** Mensajes que escribió (Basalt + Expertos). Basalt guarda como mucho 50 conversaciones
   *  por usuario y se pueden borrar, así que es un piso, no un total histórico. */
  messages?: number;
  chats?: number;
  images?: number;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
}

// Debe coincidir con los planes reales de src/pages/Pricing.tsx y PlanTier en src/lib/ai/models.ts.
export const TIERS: Record<string, { label: string; color: string; icon: string }> = {
  free:      { label: "Free",       color: "#6B7280", icon: "Zap" },
  creador:   { label: "Creador",    color: "#4ADE80", icon: "Zap" },
  pro:       { label: "Pro",        color: "#A855F7", icon: "Rocket" },
  agencia:   { label: "Agencia",    color: "#F59E0B", icon: "Crown" },
  pyme:      { label: "Pyme",       color: "#EC4899", icon: "Crown" },
};
