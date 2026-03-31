export const CREDIT_PACKS = [
  {
    id: "pack_100",
    name: "🚀 100K Créditos",
    description: "Ideal para iniciar tus proyectos",
    price: "$25.000 COP",
    price_id: "pack_100_id",
    credits_amount: 100_000,
    popular: false,
  },
  {
    id: "pack_500",
    name: "⚡️ 500K Créditos",
    description: "Prototipos + Cloud Storage",
    price: "$90.000 COP",
    price_id: "pack_500_id",
    credits_amount: 500_000,
    popular: true,
  },
  {
    id: "pack_1000",
    name: "🔥 1M Créditos",
    description: "Usuarios PRO y Full-stack",
    price: "$150.000 COP",
    price_id: "pack_1000_id",
    credits_amount: 1_000_000,
    popular: false,
  },
] as const;
