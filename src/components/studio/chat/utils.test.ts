import { describe, it, expect } from "vitest";
import { detectIntent } from "./utils";

describe("detectIntent — preguntas genuinas van a chat, no a codegen", () => {
  it("no reescribe el proyecto cuando el usuario solo pregunta qué mejorar (bug real verificado en vivo)", () => {
    // "mejorarías" contiene "mejora" como substring — sin el fix de
    // detección de preguntas, esto caía en TECH_KEYWORDS y generaba código
    // sin que el usuario lo pidiera.
    expect(detectIntent("¿qué le mejorarías a este proyecto?")).toBe("chat");
  });

  it("trata otras preguntas con palabras de codegen como conversación", () => {
    expect(detectIntent("¿cómo está el diseño de este componente?")).toBe("chat");
    expect(detectIntent("¿qué opinas del estilo actual?")).toBe("chat");
  });

  it("sigue generando código cuando la pregunta trae un verbo de acción real", () => {
    expect(detectIntent("¿puedes crear un botón de login?")).not.toBe("chat");
    expect(detectIntent("¿podrías agregar un formulario de contacto?")).not.toBe("chat");
  });

  it("no rompe los casos ya cubiertos: saludo, reasoning y comandos directos", () => {
    expect(detectIntent("hola")).toBe("chat");
    expect(detectIntent("dame un plan")).toBe("reasoning");
    expect(detectIntent("crea una landing page para mi cafetería")).toBe("fullstack");
    expect(detectIntent("agrega un botón azul al hero")).toBe("codegen");
  });
});

describe("detectIntent — pedidos de video (sin proveedor conectado todavía)", () => {
  it("reconoce un pedido de video en vez de dejarlo caer en chat/codegen sin aviso", () => {
    expect(detectIntent("hazme un video de un atardecer en la playa")).toBe("video");
    expect(detectIntent("genera un video corto para mi producto")).toBe("video");
  });

  it("no confunde un componente de video con un pedido de generar video", () => {
    // "video" como parte de un pedido de app/componente sigue siendo codegen,
    // igual que wantsImageGeneration ya excluye "imagen de fondo" en un hero.
    expect(detectIntent("crea un componente con un reproductor de video para el dashboard")).not.toBe("video");
  });
});
