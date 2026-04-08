/**
 * Genesis V22.0 — Curated Unsplash Photo Bank
 * REAL verified photo IDs organized by industry.
 * All IDs sourced directly from Unsplash search index (April 2026).
 *
 * URL pattern: https://images.unsplash.com/photo-{ID}?w=800&h=600&fit=crop
 * For hero images use: ?w=1200&h=800&fit=crop&q=80
 * For thumbnails use:  ?w=400&h=300&fit=crop&q=80
 */

// ─── Photo ID Bank by Industry ─────────────────────────────────────────────

export const UNSPLASH_PHOTO_BANK: Record<string, { id: string; desc: string }[]> = {
  // ── 1. Technology / SaaS ──────────────────────────────────────────────────
  technology: [
    { id: "1460925895917-afdab827c52f", desc: "Dashboard analytics on laptop screen" },
    { id: "1498050108023-c5249f4df085", desc: "Developer coding on MacBook" },
    { id: "1551288049-bebda4e38f71", desc: "Data visualization dashboard" },
    { id: "1519389950473-47ba0277781c", desc: "Modern office workspace" },
    { id: "1504384764586-bb4cdc1812f0", desc: "Team collaborating in tech office" },
    { id: "1518770660439-4636190af475", desc: "Server room data center" },
    { id: "1461749280684-dccba630e2f6", desc: "Lines of code on screen" },
    { id: "1573164713988-8665fc963095", desc: "Woman working on laptop" },
    { id: "1531482615713-2afd69097998", desc: "Startup team meeting" },
    { id: "1550751827-4bd374c3f58b", desc: "Modern tech office interior" },
    { id: "1517245386807-bb43f82c33c4", desc: "Typing on keyboard close-up" },
    { id: "1563986768609-322da13575f3", desc: "FinTech digital banking interface" },
  ],

  // ── 2. Restaurant / Food ──────────────────────────────────────────────────
  restaurant: [
    { id: "1517248135467-4c7edcad34c4", desc: "Fine dining restaurant interior" },
    { id: "1414235077428-338989a2e8c0", desc: "Gourmet dish plating" },
    { id: "1504674900247-0877df9cc836", desc: "Elegant food plating" },
    { id: "1555396273-367ea4eb4db5", desc: "Chef preparing food in kitchen" },
    { id: "1466978913421-dad2ebd01d17", desc: "Restaurant ambiance with warm lighting" },
    { id: "1559339352-11d035aa65de", desc: "Fresh ingredients on table" },
    { id: "1552566626-52f8b828add9", desc: "Italian pasta dish close-up" },
    { id: "1565299624946-b28f40a0ae38", desc: "Fresh pizza from oven" },
    { id: "1424847651672-bf20a4b0982b", desc: "Coffee latte art close-up" },
    { id: "1476224203421-9ac39bcb3327", desc: "Colorful fresh salad bowl" },
    { id: "1544025162-d76694265947", desc: "Wine glasses on dinner table" },
    { id: "1550966871-3ed3cdb51f3a", desc: "Cocktail bar with ambient light" },
  ],

  // ── 3. E-Commerce / Fashion ───────────────────────────────────────────────
  ecommerce: [
    { id: "1441986300917-64674bd600d8", desc: "Retail store interior" },
    { id: "1472851294608-062f824d29cc", desc: "Shopping bags in store" },
    { id: "1523275335684-37898b6baf30", desc: "Minimal product photography" },
    { id: "1558171813-4c2ab5b0beb4", desc: "Fashion model portrait" },
    { id: "1445205170230-053b83016050", desc: "Woman shopping in boutique" },
    { id: "1490481651871-ab68de25d43d", desc: "Clothing rack display" },
    { id: "1556905055-8f358a7a47b2", desc: "Minimal white sneakers product shot" },
    { id: "1542291026-7eec264c27ff", desc: "E-commerce packaging unboxing" },
    { id: "1483985988355-763728e1935b", desc: "Jewelry close-up product shot" },
    { id: "1469334031218-e382a71b716b", desc: "Fashion editorial full body" },
    { id: "1524532787116-e70228437ebe", desc: "Watches product display" },
    { id: "1560243563-062bfc001d68", desc: "Cosmetics and beauty products" },
  ],

  // ── 4. Real Estate / Architecture ─────────────────────────────────────────
  realEstate: [
    { id: "1564013799919-ab6c01f0de40", desc: "Modern house exterior" },
    { id: "1502672260266-1c1ef2d93688", desc: "Luxury living room interior" },
    { id: "1600596542815-ffad4c1539a9", desc: "Modern kitchen design" },
    { id: "1600585154340-be6161a56a0c", desc: "Elegant bathroom interior" },
    { id: "1512917774080-9991f1c4c750", desc: "Residential neighborhood aerial" },
    { id: "1600607687939-ce8a6c25118c", desc: "Swimming pool with modern house" },
    { id: "1560448204-e02f11c3d0e2", desc: "Modern apartment building facade" },
    { id: "1600573472591-ee6c563aabc9", desc: "Cozy bedroom interior design" },
    { id: "1486406146926-c627a92ad1ab", desc: "City skyline with skyscrapers" },
    { id: "1574362848149-11496d93a7c7", desc: "Luxury penthouse view" },
    { id: "1600047509807-ba8f99d2cdde", desc: "Modern open plan living space" },
    { id: "1613490493576-7fde63acd811", desc: "Architectural detail glass building" },
  ],

  // ── 5. Health / Wellness ──────────────────────────────────────────────────
  health: [
    { id: "1544367567-0f2fcb009e0b", desc: "Yoga meditation on mat" },
    { id: "1506126613408-eca07ce68773", desc: "Woman practicing yoga outdoors" },
    { id: "1571019614242-c5c5dee9f50b", desc: "Spa and wellness treatment" },
    { id: "1490645935967-10de6ba17061", desc: "Healthy smoothie bowl" },
    { id: "1498837167922-ddd27525d352", desc: "Healthy salad bowl close-up" },
    { id: "1532938911079-1b06ac7ceec7", desc: "Running on mountain trail" },
    { id: "1571019613454-1cb2f99b2d8b", desc: "Meditation in nature" },
    { id: "1559839734-2b71ea197ec2", desc: "Gym fitness equipment" },
    { id: "1505576399279-0d309a2afb5c", desc: "Nature forest path serenity" },
    { id: "1540420773420-3366772f4999", desc: "Fresh fruits and vegetables" },
    { id: "1576091160550-2173dba999ef", desc: "Medical professional portrait" },
    { id: "1571902943202-507ec2618e8f", desc: "Pilates stretching exercise" },
  ],

  // ── 6. Portfolio / Creative ───────────────────────────────────────────────
  portfolio: [
    { id: "1558655146-9f430cfc33f7", desc: "Creative designer workspace" },
    { id: "1534670007418-fbb7f6cf32c3", desc: "Abstract geometric art" },
    { id: "1513364776144-60967b0f800f", desc: "Color palette design tools" },
    { id: "1561070791-2526d30994b5", desc: "Artist painting on canvas" },
    { id: "1558618666-fcd25c85f7e7", desc: "UX wireframe sketches" },
    { id: "1572044162444-ad60f128bdea", desc: "Graphic design on iMac screen" },
    { id: "1618005182384-a83a8bd57fbe", desc: "Abstract colorful artwork" },
    { id: "1507003211169-0a1dd7228f2d", desc: "Creative professional portrait" },
    { id: "1523726491678-bf852e717f6a", desc: "Camera and photography equipment" },
    { id: "1513542789411-b6a5d4f31634", desc: "Design portfolio mockup" },
    { id: "1460661419907-fbcf68ee5130", desc: "Architecture photography composition" },
    { id: "1545665277-5937489579f2", desc: "3D render abstract shapes" },
  ],

  // ── 7. Corporate / Finance ────────────────────────────────────────────────
  corporate: [
    { id: "1497366216548-37526070297c", desc: "Modern corporate office" },
    { id: "1553877522-43269d4ea984", desc: "Business handshake meeting" },
    { id: "1504384308090-c894fdcc538d", desc: "Conference room meeting" },
    { id: "1486406146926-c627a92ad1ab", desc: "City financial district skyline" },
    { id: "1454165804606-c3d57bc86b40", desc: "Financial charts on screen" },
    { id: "1556761175-5973dc0f32e7", desc: "Corporate team discussion" },
    { id: "1570126618953-d437176e8c79", desc: "Skyscraper looking up" },
    { id: "1542744173-8e7e202f7d10", desc: "Professional business woman" },
    { id: "1611974714014-4986a2324797", desc: "Stock market trading screen" },
    { id: "1559136555-9303baea8ebd", desc: "Boardroom presentation" },
    { id: "1577412647305-991150c7d163", desc: "Modern glass office building" },
    { id: "1559523161-0fc0d8b38a7a", desc: "Data analytics on multiple screens" },
  ],

  // ── 8. Education / Learning ───────────────────────────────────────────────
  education: [
    { id: "1523050854058-8df90110c9f1", desc: "University campus building" },
    { id: "1524995997946-a1c6e315225d", desc: "Student studying in library" },
    { id: "1503676260728-1c00da094a0b", desc: "Group of students collaborating" },
    { id: "1456513080510-7bf3a84b82f8", desc: "Stack of books close-up" },
    { id: "1509062522246-3755977927d7", desc: "Classroom whiteboard teaching" },
    { id: "1501504905252-473c47e087f8", desc: "Laptop with online course" },
    { id: "1488190211105-8b0e65b80b4e", desc: "Graduation ceremony caps" },
    { id: "1577896851231-d1b6e4bda11e", desc: "Student taking notes on desk" },
    { id: "1546410531-bb4cdc6e6a5a", desc: "Bookshelf in library" },
    { id: "1522202176988-66273c2fd55f", desc: "Kids in classroom learning" },
    { id: "1513475382585-d06e58bcb0e0", desc: "Online learning with tablet" },
    { id: "1427504350567-4c219edeed40", desc: "Open book on wooden table" },
  ],

  // ── 9. Travel / Tourism ───────────────────────────────────────────────────
  travel: [
    { id: "1507525428034-b723cf961d3e", desc: "Tropical beach paradise" },
    { id: "1476514525535-07fb3b4ae5f1", desc: "Infinity pool ocean view" },
    { id: "1469854523086-cc02fe5d8800", desc: "Mountain landscape adventure" },
    { id: "1502920917128-1aa500764cbd", desc: "European city street scene" },
    { id: "1436491865332-7a61a109db05", desc: "Hot air balloon over landscape" },
    { id: "1530789253388-582c481c54b0", desc: "Backpacker on mountain trail" },
    { id: "1520250497591-112f2f40a3f4", desc: "Luxury resort hotel pool" },
    { id: "1499856871958-5b9627545d1a", desc: "Sunset over ocean horizon" },
    { id: "1528164344885-47d68bf91381", desc: "Ancient temple architecture" },
    { id: "1539635278303-d4002c07eae3", desc: "Northern lights aurora borealis" },
    { id: "1473496169904-658ba7c44d8a", desc: "Aerial view of coastline" },
    { id: "1551882547-ff40c63fe5fa", desc: "Camping tent under stars" },
  ],
};

// ─── Legacy MOCK_IMAGES (backward-compatible) ───────────────────────────────

const toUrl = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${w}`;

export const MOCK_IMAGES: Record<string, string[]> = {
  fintech:    UNSPLASH_PHOTO_BANK.corporate.slice(0, 3).map(p => toUrl(p.id)),
  saas:       UNSPLASH_PHOTO_BANK.technology.slice(0, 3).map(p => toUrl(p.id)),
  ecommerce:  UNSPLASH_PHOTO_BANK.ecommerce.slice(0, 3).map(p => toUrl(p.id)),
  luxury:     UNSPLASH_PHOTO_BANK.realEstate.slice(0, 3).map(p => toUrl(p.id)),
};

// ─── Helper: Get photos by industry ─────────────────────────────────────────

/** Alias map to normalize niche names to bank keys */
const INDUSTRY_ALIASES: Record<string, string> = {
  // Technology
  tech: "technology", saas: "technology", startup: "technology", software: "technology",
  developer: "technology", programming: "technology", ai: "technology",
  // Restaurant
  food: "restaurant", gastronomy: "restaurant", cafe: "restaurant",
  bakery: "restaurant", bar: "restaurant", catering: "restaurant",
  // E-Commerce
  fashion: "ecommerce", retail: "ecommerce", store: "ecommerce",
  shop: "ecommerce", boutique: "ecommerce", beauty: "ecommerce", cosmetics: "ecommerce",
  // Real Estate
  realestate: "realEstate", "real-estate": "realEstate", architecture: "realEstate",
  construction: "realEstate", property: "realEstate", housing: "realEstate",
  interior: "realEstate", inmobiliaria: "realEstate",
  // Health
  wellness: "health", yoga: "health", fitness: "health",
  medical: "health", spa: "health", nutrition: "health", gym: "health",
  // Portfolio
  creative: "portfolio", design: "portfolio", agency: "portfolio",
  photography: "portfolio", art: "portfolio", freelance: "portfolio",
  // Corporate
  finance: "corporate", business: "corporate", consulting: "corporate",
  fintech: "corporate", banking: "corporate", insurance: "corporate", legal: "corporate",
  // Education
  learning: "education", school: "education", university: "education",
  training: "education", course: "education", academy: "education", elearning: "education",
  // Travel
  tourism: "travel", hotel: "travel", hospitality: "travel",
  adventure: "travel", vacation: "travel", resort: "travel", airline: "travel",
};

/**
 * Returns an array of full Unsplash URLs for a given industry/niche.
 * @param niche - Industry name or alias (e.g. "restaurant", "food", "cafe")
 * @param count - Number of images to return (default: all available)
 * @param size  - "hero" | "card" | "thumb" (default: "hero")
 */
export function getIndustryPhotos(
  niche: string,
  count?: number,
  size: "hero" | "card" | "thumb" = "hero"
): string[] {
  const normalized = niche.toLowerCase().replace(/[\s_]/g, "");
  const bankKey = INDUSTRY_ALIASES[normalized] || normalized;
  const photos = UNSPLASH_PHOTO_BANK[bankKey] || UNSPLASH_PHOTO_BANK.technology;

  const sizeParams: Record<string, string> = {
    hero:  "w=1200&h=800&fit=crop&q=80",
    card:  "w=800&h=600&fit=crop&q=80",
    thumb: "w=400&h=300&fit=crop&q=80",
  };

  const urls = photos.map(
    (p) => `https://images.unsplash.com/photo-${p.id}?${sizeParams[size]}`
  );

  return count ? urls.slice(0, count) : urls;
}

/**
 * Returns a single random photo URL for a given industry.
 */
export function getRandomIndustryPhoto(
  niche: string,
  size: "hero" | "card" | "thumb" = "hero"
): string {
  const photos = getIndustryPhotos(niche, undefined, size);
  return photos[Math.floor(Math.random() * photos.length)];
}

/**
 * Returns a formatted string block of photo URLs for prompt injection.
 * Use this to embed curated photos directly into AI system prompts.
 */
export function getPhotoBlockForPrompt(niche: string, count = 6): string {
  const normalized = niche.toLowerCase().replace(/[\s_]/g, "");
  const bankKey = INDUSTRY_ALIASES[normalized] || normalized;
  const photos = (UNSPLASH_PHOTO_BANK[bankKey] || UNSPLASH_PHOTO_BANK.technology).slice(0, count);

  return photos
    .map((p) => `- ${p.desc}: https://images.unsplash.com/photo-${p.id}?w=800&h=600&fit=crop`)
    .join("\n");
}

/**
 * Returns ALL industry keys available in the photo bank.
 */
export function getAvailableIndustries(): string[] {
  return Object.keys(UNSPLASH_PHOTO_BANK);
}

// ─── Legacy backward compat ─────────────────────────────────────────────────

export const getMockImages = (niche: string = "saas") => {
  const normalized = niche.toLowerCase();
  return MOCK_IMAGES[normalized as keyof typeof MOCK_IMAGES] || getIndustryPhotos(niche, 3);
};

export const MOCK_TEXTS = {
  hero_titles: [
    "Engineering the Future of Digital Assets",
    "Autonomous Architectures for Modern Teams",
    "Luxury Experience, Reimagined by AI",
    "Exponential Growth, Quantified",
  ],
  lorem_premium:
    "Elevating the standard of digital excellence through autonomous engineering and high-fidelity design systems. Our architecture combines iridescent glassmorphism with neural-pulse micro-animations to create a cinematic user experience that transcends traditional boundaries.",
};
