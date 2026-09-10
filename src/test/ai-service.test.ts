import { describe, it, expect, vi, beforeEach } from "vitest";
import { aiService } from "@/services/ai-service";

// ─── Mock fetch — ai-service.ts calls /api/ai/chat and /api/ai/image directly,
// no Supabase involved anymore. ──────────────────────────────────────────────
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

function sseResponse(chunks: string[], opts: { ok?: boolean; status?: number } = {}) {
  const body = chunks.map((c) => `data: ${JSON.stringify({ choices: [{ delta: { content: c } }] })}\n\n`).join("") + "data: [DONE]\n\n";
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(body));
      controller.close();
    },
  });
  return {
    ok: opts.ok ?? true,
    status: opts.status ?? 200,
    body: stream,
    headers: new Headers({ "content-type": "text/event-stream" }),
    json: async () => ({}),
  } as unknown as Response;
}

function jsonResponse(data: unknown, opts: { ok?: boolean; status?: number } = {}) {
  return {
    ok: opts.ok ?? true,
    status: opts.status ?? 200,
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => data,
  } as unknown as Response;
}

describe("aiService — Text Generation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns text from /api/ai/chat", async () => {
    mockFetch.mockResolvedValueOnce(sseResponse(["Este es ", "el texto generado."]));

    const result = await aiService.processAction({
      action: "chat",
      prompt: "¿Qué es el marketing de contenidos?",
      model: "deepseek-chat",
    });

    expect(result.text).toBe("Este es el texto generado.");
    expect(mockFetch).toHaveBeenCalledWith("/api/ai/chat", expect.objectContaining({ method: "POST", credentials: "include" }));
  });

  it("translates internal model ids to real OpenRouter ids", async () => {
    mockFetch.mockResolvedValueOnce(sseResponse(["ok"]));

    await aiService.processAction({ action: "chat", prompt: "hola", model: "claude-3.5-sonnet" });

    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sentBody.model).toBe("anthropic/claude-sonnet-4.5");
  });

  it("throws when the server returns an error", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: false, error: "No tienes créditos suficientes." }, { ok: false, status: 402 }));

    await expect(
      aiService.processAction({ action: "chat", prompt: "test", model: "deepseek-chat" })
    ).rejects.toThrow("No tienes créditos suficientes.");
  });

  it("throws when the model returns an empty response", async () => {
    mockFetch.mockResolvedValueOnce(sseResponse([]));

    await expect(
      aiService.processAction({ action: "chat", prompt: "test", model: "deepseek-chat" })
    ).rejects.toThrow("vacía");
  });
});

describe("aiService — Image Generation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a URL when /api/ai/image succeeds", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true, imageUrl: "https://cdn.replicate.com/x.png", model: "flux-schnell" }));

    const result = await aiService.processAction({ action: "image", prompt: "un gato en marte", model: "flux-schnell" });

    expect(result.url).toBe("https://cdn.replicate.com/x.png");
    expect(mockFetch).toHaveBeenCalledWith("/api/ai/image", expect.objectContaining({ method: "POST", credentials: "include" }));
  });

  it("translates internal image model ids to the real catalog", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true, imageUrl: "https://x/y.png" }));

    await aiService.processAction({ action: "image", prompt: "logo", model: "flux-pro-1.1" });

    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sentBody.model).toBe("gemini-flash-image");
  });

  it("appends logo style modifiers for the logo tool", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true, imageUrl: "https://example.com/logo.png" }));

    await aiService.processAction({ action: "image", prompt: "café origen", model: "flux-schnell", tool: "logo" });

    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sentBody.prompt).toContain("professional logo design");
  });

  it("passes a reference image as imagePrompt for style/product tools", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true, imageUrl: "https://example.com/out.png" }));

    await aiService.processAction({
      action: "image", prompt: "aplica este estilo", model: "flux-pro", tool: "style", image: "https://example.com/ref.png",
    });

    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sentBody.imagePrompt).toBe("https://example.com/ref.png");
  });

  it("throws if image is missing for style/product/variation tools", async () => {
    await expect(
      aiService.processAction({ action: "image", prompt: "sin imagen", model: "flux-pro", tool: "style" })
    ).rejects.toThrow("requiere una imagen");
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("aiService — Disabled tools (not yet migrated off Supabase)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws a clear message for media-proxy-only tools instead of calling a dead endpoint", async () => {
    for (const tool of ["upscale", "background", "enhance", "restore", "eraser"]) {
      await expect(
        aiService.processAction({ action: "image", prompt: "x", model: "flux-schnell", tool, image: "https://x/y.png" })
      ).rejects.toThrow("temporalmente deshabilitada");
    }
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("throws a clear message for video generation", async () => {
    await expect(
      aiService.processAction({ action: "video", prompt: "x", model: "wan-2.5" })
    ).rejects.toThrow("temporalmente deshabilitada");
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("aiService — Model Routing", () => {
  beforeEach(() => vi.clearAllMocks());

  it("routes image actions to handleImageGen (not text)", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true, imageUrl: "https://image.example.com/x.png" }));

    const result = await aiService.processAction({ action: "image", prompt: "portrait photo", model: "flux-schnell" });

    expect(result.url).toBeDefined();
    expect((result as any).text).toBeUndefined();
  });

  it("routes chat actions to handleTextGen (not image)", async () => {
    mockFetch.mockResolvedValueOnce(sseResponse(["texto respuesta"]));

    const result = await aiService.processAction({ action: "chat", prompt: "explain quantum computing", model: "claude-3.5-sonnet" });

    expect(result.text).toBeDefined();
    expect((result as any).url).toBeUndefined();
  });
});
