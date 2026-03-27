// ─── Stripe Tiers ─────────────────────────────────────────────────────────────
// ⚠️  IMPORTANT: Create these products in your Stripe dashboard and update price_ids.
// Run in terminal: supabase secrets set STRIPE_SECRET_KEY=sk_live_...
//
// New tier pricing (2026):
//   Starter  $12/mo  →  100,000 credits  ECO models only
//   Creator  $29/mo  →  500,000 credits  ECO + PRO (Claude, GPT-4o)
//   Agency   $79/mo  → 2,000,000 credits All models (ECO+PRO+ULTRA)

export const STRIPE_TIERS = {
  // ── Legacy tiers (kept for backwards compatibility) ────────────────────────
  educacion: {
    name: 'Educación',
    price_id: 'price_1T8jnYHXiILe6LmroPsg0l33',
    product_id: 'prod_U6xj2kgXVmXSBX',
    credits: 500,
    price: '$4.99',
    tier_key: 'educacion',
  },
  pro: {
    name: 'Pro',
    price_id: 'price_1T8joOHXiILe6LmrLhyVJyPB',
    product_id: 'prod_U6xjReaTzoFveY',
    credits: 1000,
    price: '$9.99',
    tier_key: 'pro',
  },
  business: {
    name: 'Business',
    price_id: 'price_1T8jomHXiILe6Lmr5Aupx4nD',
    product_id: 'prod_U6xkDNO9PA3C9C',
    credits: 5000,
    price: '$49.99',
    tier_key: 'business',
  },

  // ── New tiers (v2 pricing) ─────────────────────────────────────────────────
  // TODO: Replace price_id with real Stripe IDs after creating products
  starter: {
    name: 'Starter',
    price_id: 'price_starter_REPLACE_ME',   // ← Create in Stripe dashboard
    product_id: 'prod_starter_REPLACE_ME',
    credits: 100_000,
    price: '$12',
    tier_key: 'starter',
  },
  creator: {
    name: 'Creator',
    price_id: 'price_creator_REPLACE_ME',   // ← Create in Stripe dashboard
    product_id: 'prod_creator_REPLACE_ME',
    credits: 500_000,
    price: '$29',
    tier_key: 'creator',
  },
  agency: {
    name: 'Agency',
    price_id: 'price_agency_REPLACE_ME',    // ← Create in Stripe dashboard
    product_id: 'prod_agency_REPLACE_ME',
    credits: 2_000_000,
    price: '$79',
    tier_key: 'agency',
  },
} as const;

export type StripeTierKey = keyof typeof STRIPE_TIERS;
