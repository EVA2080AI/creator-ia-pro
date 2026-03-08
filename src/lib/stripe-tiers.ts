export const STRIPE_TIERS = {
  educacion: {
    name: "Educación",
    price_id: "price_1T8jnYHXiILe6LmroPsg0l33",
    product_id: "prod_U6xj2kgXVmXSBX",
    credits: 500,
    price: "$4.99",
  },
  pro: {
    name: "Pro",
    price_id: "price_1T8joOHXiILe6LmrLhyVJyPB",
    product_id: "prod_U6xjReaTzoFveY",
    credits: 1000,
    price: "$9.99",
  },
  business: {
    name: "Business",
    price_id: "price_1T8jomHXiILe6Lmr5Aupx4nD",
    product_id: "prod_U6xkDNO9PA3C9C",
    credits: 5000,
    price: "$49.99",
  },
} as const;

export type StripeTierKey = keyof typeof STRIPE_TIERS;
