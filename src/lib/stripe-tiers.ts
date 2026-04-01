// ─── Stripe Tiers ─────────────────────────────────────────────────────────────
// ⚠️  IMPORTANT: Create these products in your Stripe dashboard and update price_ids.
// Run in terminal: supabase secrets set STRIPE_SECRET_KEY=sk_live_...
//
// New tier pricing (2026):
//   Starter  $69,000/mo  →  500 credits
//   Creator  $138,000/mo →  1.200 credits
//   Pymes    $345,000/mo →  4.000 credits All models (Premium)

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

  // ── New tiers (v3 pricing) ─────────────────────────────────────────────────
  // TODO: Replace price_id with real Stripe IDs after creating products
  starter: {
    name: 'Starter',
    price_id: 'price_1TFaHzHXiILe6LmrJ2KTUaGx', // UPDATE THIS IN STRIPE
    product_id: 'prod_UE2MjSRJAsKDnj', // UPDATE THIS IN STRIPE
    credits: 500,
    price: '$69.000 COP',
    tier_key: 'starter',
  },
  creator: {
    name: 'Creator',
    price_id: 'price_1TFaIYHXiILe6LmrYe9kJoFT', // UPDATE THIS IN STRIPE
    product_id: 'prod_UE2NGBRjcHbZPk', // UPDATE THIS IN STRIPE
    credits: 1200,
    price: '$138.000 COP',
    tier_key: 'creator',
  },
  pymes: {
    name: 'Pymes',
    price_id: 'price_1TFaIaHXiILe6LmrYwfqWW3Z', // UPDATE THIS IN STRIPE
    product_id: 'prod_UE2NDJ9HS6wxBF', // UPDATE THIS IN STRIPE
    credits: 4000,
    price: '$345.000 COP',
    tier_key: 'pymes',
  },
} as const;

export type StripeTierKey = keyof typeof STRIPE_TIERS;
