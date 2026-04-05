/**
 * Genesis V16.0 — High-Fidelity Mock Data Registry
 * Curated assets for rapid visual synthesis.
 */

export const MOCK_IMAGES = {
  fintech: [
    "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1611974714014-4986a2324797?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200"
  ],
  saas: [
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200"
  ],
  ecommerce: [
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1200"
  ],
  luxury: [
    "https://images.unsplash.com/photo-1583333222044-589c4ca1e179?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1549433193-42a24aa73760?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1511405946472-a37e3b5ccd47?auto=format&fit=crop&q=80&w=1200"
  ]
};

export const MOCK_TEXTS = {
  hero_titles: [
    "Engineering the Future of Digital Assets",
    "Autonomous Architectures for Modern Teams",
    "Luxury Experience, Reimagined by AI",
    "Exponential Growth, Quantified"
  ],
  lorem_premium: "Elevating the standard of digital excellence through autonomous engineering and high-fidelity design systems. Our architecture combines iridescent glassmorphism with neural-pulse micro-animations to create a cinematic user experience that transcends traditional boundaries."
};

/**
 * Returns a list of mock images for a specific niche
 */
export const getMockImages = (niche: string = 'saas') => {
  const normalized = niche.toLowerCase();
  return MOCK_IMAGES[normalized as keyof typeof MOCK_IMAGES] || MOCK_IMAGES.saas;
};
