import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Mock Supabase ─────────────────────────────────────────────────────────────
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
    rpc: vi.fn(),
  },
}));

// ─── Mock fetch ───────────────────────────────────────────────────────────────
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { supabase } from "@/integrations/supabase/client";
import { aiService } from "@/services/ai-service";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeSupabaseMocks(opts: {
  userId?: string;
  tier?: string;
  credits?: number;
  spendError?: string;
} = {}) {
  const userId = opts.userId ?? "user-123";
  const mockedSupabase = supabase as any;

  mockedSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: userId } },
    error: null,
  });

  mockedSupabase.from.mockImplementation((table: string) => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: {
        subscription_tier: opts.tier ?? "creator",
        credits_balance: opts.credits ?? 500,
      },
      error: null,
    }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockReturnThis(),
  }));

  mockedSupabase.rpc.mockImplementation((fn: string) => {
    if (fn === "spend_credits") {
      return Promise.resolve({
        data: null,
        error: opts.spendError ? { message: opts.spendError } : null,
      });
    }
    if (fn === "refund_credits") {
      return Promise.resolve({ data: null, error: null });
    }
    return Promise.resolve({ data: null, error: null });
  });
}

// ─── Tests: Image Generation ──────────────────────────────────────────────────
describe("aiService — Image Generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a URL when OpenRouter proxy succeeds (b64_json)", async () => {
    makeSupabaseMocks();
    (supabase.functions.invoke as any).mockResolvedValue({
      data: {
        data: [{ b64_json: "abc123imagedata" }],
      },
      error: null,
    });

    const result = await aiService.processAction({
      action: "image",
      prompt: "un gato en marte",
      model: "nano-banana-pro",
    });

    expect(result.url).toBe("data:image/png;base64,abc123imagedata");
  });

  it("returns a URL when OpenRouter proxy succeeds (url field)", async () => {
    makeSupabaseMocks();
    (supabase.functions.invoke as any).mockResolvedValue({
      data: {
        data: [{ url: "https://cdn.openrouter.ai/image.png" }],
      },
      error: null,
    });

    const result = await aiService.processAction({
      action: "image",
      prompt: "paisaje urbano cyberpunk",
      model: "nano-banana-2",
    });

    expect(result.url).toBe("https://cdn.openrouter.ai/image.png");
  });

  it("falls back to Gemini when OpenRouter returns empty data", async () => {
    makeSupabaseMocks();
    // OpenRouter returns empty
    (supabase.functions.invoke as any)
      .mockResolvedValueOnce({ data: { data: [] }, error: null })
      // Gemini returns image
      .mockResolvedValueOnce({
        data: {
          candidates: [{
            content: {
              parts: [{ inlineData: { data: "geminibase64", mimeType: "image/png" } }],
            },
          }],
        },
        error: null,
      });

    const result = await aiService.processAction({
      action: "image",
      prompt: "logo minimalista",
      model: "nano-banana-25",
    });

    expect(result.url).toContain("geminibase64");
  });

  it("falls back to Pollinations direct URL when all proxies fail", async () => {
    makeSupabaseMocks();
    // All invoke calls fail
    (supabase.functions.invoke as any).mockRejectedValue(new Error("network error"));

    const result = await aiService.processAction({
      action: "image",
      prompt: "abstract art test",
      model: "nano-banana-2",
    });

    expect(result.url).toContain("image.pollinations.ai");
    expect(result.url).toContain(encodeURIComponent("abstract art test"));
  });

  it("throws when credits are insufficient", async () => {
    makeSupabaseMocks({ spendError: "Créditos insuficientes" });

    await expect(
      aiService.processAction({
        action: "image",
        prompt: "test image",
        model: "nano-banana-pro",
      })
    ).rejects.toThrow("Créditos insuficientes");
  });

  it("throws when user is not authenticated", async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(
      aiService.processAction({
        action: "image",
        prompt: "test",
        model: "nano-banana-2",
      })
    ).rejects.toThrow("Acceso no autorizado");
  });

  it("appends logo style modifiers for logo tool", async () => {
    makeSupabaseMocks();
    let capturedBody: any;
    (supabase.functions.invoke as any).mockImplementation((_fn: string, opts: any) => {
      capturedBody = opts?.body;
      return Promise.resolve({ data: { data: [{ url: "https://example.com/logo.png" }] }, error: null });
    });

    await aiService.processAction({
      action: "image",
      prompt: "café origen",
      model: "nano-banana-pro",
      tool: "logo",
    });

    const sentPrompt = capturedBody?.body?.prompt ?? "";
    expect(sentPrompt).toContain("professional logo design");
  });
});

// ─── Tests: Text Generation ───────────────────────────────────────────────────
describe("aiService — Text Generation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns text from OpenRouter proxy", async () => {
    makeSupabaseMocks();
    (supabase.functions.invoke as any).mockResolvedValue({
      data: {
        choices: [{ message: { content: "Este es el texto generado por IA." } }],
      },
      error: null,
    });

    const result = await aiService.processAction({
      action: "chat",
      prompt: "¿Qué es el marketing de contenidos?",
      model: "deepseek-chat",
    });

    expect(result.text).toBe("Este es el texto generado por IA.");
  });

  it("falls back to Gemini when OpenRouter proxy fails for text", async () => {
    makeSupabaseMocks();
    (supabase.functions.invoke as any)
      .mockRejectedValueOnce(new Error("openrouter down"))
      .mockResolvedValueOnce({
        data: {
          candidates: [{
            content: { parts: [{ text: "Respuesta de Gemini." }] },
          }],
        },
        error: null,
      });

    const result = await aiService.processAction({
      action: "chat",
      prompt: "¿Qué es SEO?",
      model: "gemini-3-flash",
    });

    expect(result.text).toBe("Respuesta de Gemini.");
  });

  it("refunds credits on error after deduction", async () => {
    makeSupabaseMocks();
    (supabase.functions.invoke as any).mockRejectedValue(new Error("fatal error"));

    const mockedRpc = supabase.rpc as any;

    await expect(
      aiService.processAction({
        action: "chat",
        prompt: "test",
        model: "deepseek-chat",
      })
    ).rejects.toThrow();

    const calls = mockedRpc.mock.calls.map((c: any[]) => c[0]);
    expect(calls).toContain("spend_credits");
    expect(calls).toContain("refund_credits");
  });
});

// ─── Tests: Media Proxy ───────────────────────────────────────────────────────
describe("aiService — Media Proxy Tools", () => {
  beforeEach(() => vi.clearAllMocks());

  const imageTools = ["upscale", "background", "enhance", "restore", "variation"] as const;

  imageTools.forEach((tool) => {
    it(`calls media-proxy edge function for tool: ${tool}`, async () => {
      makeSupabaseMocks();
      (supabase.functions.invoke as any).mockResolvedValue({
        data: { url: `https://result.cdn/${tool}.png` },
        error: null,
      });

      const result = await aiService.processAction({
        action: "image",
        prompt: "apply tool",
        model: "nano-banana-pro",
        tool,
        image: "https://example.com/source.png",
      });

      expect(result.url).toContain(tool);

      const invokeCall = (supabase.functions.invoke as any).mock.calls.find(
        (c: any[]) => c[0] === "media-proxy"
      );
      expect(invokeCall).toBeDefined();
      expect(invokeCall[1].body.tool).toBe(tool);
    });
  });

  it("throws if image is missing for media-proxy tools", async () => {
    makeSupabaseMocks();

    await expect(
      aiService.processAction({
        action: "image",
        prompt: "enhance without source",
        model: "nano-banana-pro",
        tool: "enhance",
        // no image property
      })
    ).rejects.toThrow('requiere una imagen');
  });
});

// ─── Tests: Model Routing ──────────────────────────────────────────────────────
describe("aiService — Model Routing", () => {
  beforeEach(() => vi.clearAllMocks());

  it("routes image actions to handleImageGen (not text)", async () => {
    makeSupabaseMocks();
    (supabase.functions.invoke as any).mockResolvedValue({
      data: { data: [{ url: "https://image.example.com/x.png" }] },
      error: null,
    });

    const result = await aiService.processAction({
      action: "image",
      prompt: "portrait photo",
      model: "nano-banana-2",
    });

    expect(result.url).toBeDefined();
    expect((result as any).text).toBeUndefined();
  });

  it("routes chat actions to handleTextGen (not image)", async () => {
    makeSupabaseMocks();
    (supabase.functions.invoke as any).mockResolvedValue({
      data: { choices: [{ message: { content: "texto respuesta" } }] },
      error: null,
    });

    const result = await aiService.processAction({
      action: "chat",
      prompt: "explain quantum computing",
      model: "claude-3.5-sonnet",
    });

    expect(result.text).toBeDefined();
    expect((result as any).url).toBeUndefined();
  });
});
