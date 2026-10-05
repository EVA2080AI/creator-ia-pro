import { describe, expect, it } from "vitest";
import { ChatError, canRetry, chatError, errorAction } from "./chat-errors";

describe("chatError", () => {
  it("conserva el mensaje y el código del servidor", () => {
    const e = chatError({ ok: false, code: "INSUFFICIENT_CREDITS", error: "Te faltan 3 créditos." }, 402);
    expect(e).toBeInstanceOf(ChatError);
    expect(e.message).toBe("Te faltan 3 créditos.");
    expect(e.code).toBe("INSUFFICIENT_CREDITS");
  });

  it("aguanta una respuesta sin cuerpo", () => {
    expect(chatError(null, 500).message).toBe("Error 500");
    expect(chatError(null, 500).code).toBeUndefined();
  });
});

describe("errorAction", () => {
  it("manda a planes cuando el usuario puede resolverlo comprando", () => {
    for (const code of ["INSUFFICIENT_CREDITS", "FREE_LIMIT_REACHED", "TIER_REQUIRED"]) {
      expect(errorAction(code)).toEqual({ label: "Ver planes", to: "/pricing" });
    }
  });

  it("no ofrece nada cuando el usuario no puede hacer nada", () => {
    expect(errorAction("NOT_CONFIGURED")).toBeNull();
    expect(errorAction("PROVIDER_ERROR")).toBeNull();
    expect(errorAction(undefined)).toBeNull();
  });
});

describe("canRetry", () => {
  it("no ofrece reintentar lo que va a volver a fallar", () => {
    expect(canRetry("INSUFFICIENT_CREDITS")).toBe(false);
    expect(canRetry("FREE_LIMIT_REACHED")).toBe(false);
  });

  it("sí para un fallo de red o del proveedor", () => {
    expect(canRetry("PROVIDER_ERROR")).toBe(true);
    expect(canRetry(undefined)).toBe(true);
  });
});
