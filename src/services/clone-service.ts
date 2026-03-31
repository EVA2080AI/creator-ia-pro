import { toast } from 'sonner';

export interface CloneResult {
  url: string;
  markdown: string;
  colors: string[];
  fonts: string[];
  sitemap: string[];
}

/**
 * Extracts hexadecimal and RGB/RGBA colors from raw text/CSS
 */
function extractColors(text: string): string[] {
  const hexRegex = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/g;
  const rgbRegex = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)/g;
  
  const colors = new Set<string>();
  const hexMatch = text.match(hexRegex);
  if (hexMatch) hexMatch.forEach(c => colors.add(c.toLowerCase()));
  
  const rgbMatch = text.match(rgbRegex);
  if (rgbMatch) rgbMatch.forEach(c => colors.add(c));

  // Sort by frequency (heuristic: shorter hex are usually less common or utility)
  return Array.from(colors).slice(0, 15); // Top 15 colors
}

/**
 * Extracts font families, focusing on Google Fonts imports
 */
function extractFonts(html: string): string[] {
  const fonts = new Set<string>();
  
  // Find Google Fonts links
  const gfRegex = /fonts\.googleapis\.com\/css2\?family=([^&:]+)/g;
  let match;
  while ((match = gfRegex.exec(html)) !== null) {
    fonts.add(decodeURIComponent(match[1]).replace(/\+/g, ' '));
  }
  
  // Fallback to basic font-family regex if no Google fonts
  if (fonts.size === 0) {
    const ffRegex = /font-family:\s*([^;}]+)/g;
    let fallbackMatch;
    while ((fallbackMatch = ffRegex.exec(html)) !== null) {
      const font = fallbackMatch[1].trim().replace(/['"]/g, '').split(',')[0];
      if (font && !['inherit', 'initial', 'sans-serif', 'serif', 'monospace'].includes(font)) {
        fonts.add(font);
      }
    }
  }

  return Array.from(fonts).slice(0, 5);
}

/**
 * Extracts basic sitemap/navigation links from the raw HTML string
 */
function extractSitemap(html: string, baseUrl: string): string[] {
  // Use a regex to find all <a href="...">
  const hrefRegex = /<a[^>]+href=["']([^"']+)["']/g;
  const links = new Set<string>();
  let match;
  
  try {
    const base = new URL(baseUrl);
    
    while ((match = hrefRegex.exec(html)) !== null) {
      let href = match[1];
      if (href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
      
      try {
        const u = new URL(href, base.href);
        // Only keep internal links (same origin)
        if (u.origin === base.origin) {
          const path = u.pathname.replace(/\/$/, '') || '/';
          links.add(path);
        }
      } catch {
        // invalid URL
      }
    }
  } catch {
    // base url invalid
  }

  // Filter out noisy paths and limit to 10 meaningful routes
  return Array.from(links)
    .filter(path => !path.match(/\.(png|jpg|js|css|json)$/i))
    .slice(0, 10);
}

/**
 * Advanced Site Cloning utilizing Jina.ai for Markdown + AllOrigins for raw HTML parsing
 */
export async function cloneWebsiteAdvanced(urlStr: string): Promise<CloneResult> {
  let url = urlStr.trim();
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  
  try {
    new URL(url);
  } catch {
    throw new Error('URL inválida');
  }

  // 1. Fetch clean Markdown via r.jina.ai
  const markdownPromise = fetch(`https://r.jina.ai/${url}`, {
    headers: { 'Accept': 'text/plain' },
    signal: AbortSignal.timeout(20000),
  }).then(r => {
    if (!r.ok) throw new Error(`Jina error: ${r.status}`);
    return r.text();
  }).catch(() => null);

  // 2. Fetch raw HTML via public CORS proxy to extract CSS and Fonts
  // Note: AllOrigins allows bypassing CORS strictly for client-side tools
  let rawHtml = '';
  try {
    const allOriginsUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const res = await fetch(allOriginsUrl, { signal: AbortSignal.timeout(15000) });
    if (res.ok) {
      const data = await res.json();
      rawHtml = data.contents || '';
    }
  } catch (err) {
    console.warn('[CloneService] AllOrigins proxy failed:', err);
  }

  // Wait for markdown
  const markdown = await markdownPromise;
  if (!markdown || markdown.length < 50) {
    throw new Error('No se pudo extraer el contenido principal del sitio.');
  }

  // 3. Extract metadata from HTML
  const colors = extractColors(rawHtml);
  const fonts = extractFonts(rawHtml);
  const sitemap = extractSitemap(rawHtml, url);

  return {
    url,
    // Trim markdown to ~12k chars to prevent token overflow
    markdown: markdown.slice(0, 12000),
    colors,
    fonts,
    sitemap,
  };
}
