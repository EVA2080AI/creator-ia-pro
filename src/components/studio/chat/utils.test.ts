import { describe, it, expect } from "vitest";
import { detectIntent, extractChatCodeFiles, processRawResponse } from "./utils";

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

describe("processRawResponse — la explicación del modelo no se pierde", () => {
  it("conserva el texto previo cuando la respuesta viene en XML (bug del panel vacío)", () => {
    // El motor usa `<file path="...">` desde v25, pero el corte se buscaba solo
    // con ```, que no aparece: toda respuesta XML perdía su explicación y el
    // panel "Estudio de Ingeniería" mostraba siempre "Código generado.".
    const raw = [
      "Genero una landing para Tinto Bogotá con menú y reservas.",
      "",
      '<file path="src/App.tsx">',
      "export default function App() { return <main>Tinto</main>; }",
      "</file>",
    ].join("\n");

    const out = processRawResponse(raw, "crea una landing", false);

    expect(out?.explanation).toBe("Genero una landing para Tinto Bogotá con menú y reservas.");
    expect(Object.keys(out?.files ?? {})).toContain("src/App.tsx");
  });

  it("sigue cortando en el primer bloque markdown cuando ese es el formato", () => {
    const raw = "Aquí va el componente.\n\n```tsx App.tsx\nexport const A = 1;\n```";

    expect(processRawResponse(raw, "crea algo", false)?.explanation).toBe("Aquí va el componente.");
  });

  it("usa el texto por defecto solo cuando el modelo no escribió explicación", () => {
    const raw = '<file path="src/App.tsx">\nexport const A = 1;\n</file>';

    expect(processRawResponse(raw, "crea algo", false)?.explanation).toBe("Código generado.");
  });
});

describe("extractChatCodeFiles — diagramas y comandos no son archivos", () => {
  it("ignora un bloque mermaid sin nombre en vez de guardarlo como App.tsx", () => {
    const files = extractChatCodeFiles("```mermaid\ngraph TD; A-->B;\n```");

    expect(files).toBeNull();
  });

  it("no deja que un bloque bash pise el archivo real que vino después", () => {
    const raw = [
      "```bash",
      "npm install react",
      "```",
      "",
      "```tsx",
      "export default function App() {",
      "  return <main>Hola</main>;",
      "}",
      "```",
    ].join("\n");
    const files = extractChatCodeFiles(raw);

    expect(Object.keys(files ?? {})).toEqual(["App.tsx"]);
    expect(files?.["App.tsx"].content).toContain("return <main>Hola</main>;");
  });
});
