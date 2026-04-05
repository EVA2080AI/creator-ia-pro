export interface AdminUser {
  user_id: string;
  email: string;
  display_name: string | null;
  credits_balance: number;
  created_at: string;
  last_sign_in: string | null;
  subscription_tier: string;
  is_active: boolean;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
}

export const TIERS: Record<string, { label: string; color: string; icon: any }> = {
  free:      { label: "Free",       color: "#6B7280", icon: "Zap" }, // Icon replaced by string for simplicity in transport, better to pass components or use a map
  starter:   { label: "Starter",    color: "#4ADE80", icon: "Zap" },
  creator:   { label: "Creator",    color: "#A855F7", icon: "Rocket" },
  pymes:     { label: "Pymes",      color: "#F59E0B", icon: "Crown" },
};
