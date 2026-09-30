import { describe, expect, it } from "vitest";
import { buildPreviewDoc, extractFilename, findMissingRefs, stackblitzFields, uniqueName, withBasaltBase, type ProjectFile } from "./project-preview";

describe("extractFilename", () => {
  it("lee el nombre de la línea de la valla (resto tras el lenguaje)", () => {
    expect(extractFilename(" index.html\n<h1>hola</h1>")).toEqual({ name: "index.html", code: "<h1>hola</h1>" });
    expect(extractFilename(' title="src/App.jsx"\nexport default 1')).toEqual({ name: "src/App.jsx", code: "export default 1" });
  });

  it("lee el nombre de un comentario en la primera línea y lo quita del código", () => {
    expect(extractFilename("<!-- index.html -->\n<h1>x</h1>")).toEqual({ name: "index.html", code: "<h1>x</h1>" });
    expect(extractFilename("/* styles.css */\nbody{}")).toEqual({ name: "styles.css", code: "body{}" });
    expect(extractFilename("// script.js\nlet a = 1")).toEqual({ name: "script.js", code: "let a = 1" });
    expect(extractFilename("# main.py\nprint(1)")).toEqual({ name: "main.py", code: "print(1)" });
  });

  it("no confunde código normal con un nombre de archivo", () => {
    expect(extractFilename("// esto es un comentario cualquiera\nlet a = 1").name).toBeUndefined();
    expect(extractFilename("const x = obj.prop").name).toBeUndefined();
    expect(extractFilename("# 2.5\nfoo").name).toBeUndefined();
  });
});

describe("uniqueName", () => {
  it("usa el nombre por defecto del lenguaje y evita colisiones", () => {
    expect(uniqueName(undefined, "html", new Set())).toBe("index.html");
    expect(uniqueName(undefined, "html", new Set(["index.html"]))).toBe("index-2.html");
    expect(uniqueName("app.js", "js", new Set(["app.js"]))).toBe("app-2.js");
  });
});

const html: ProjectFile = {
  name: "index.html",
  lang: "html",
  code: '<!DOCTYPE html><html><head><title>t</title><link rel="stylesheet" href="./styles.css"></head><body><h1>Hola</h1><script src="app.js"></script></body></html>',
};
const css: ProjectFile = { name: "styles.css", lang: "css", code: "h1{color:red}" };
const js: ProjectFile = { name: "app.js", lang: "js", code: "console.log('ok')" };

describe("buildPreviewDoc", () => {
  it("devuelve null si no hay HTML", () => {
    expect(buildPreviewDoc([css, js])).toBeNull();
  });

  it("inlinea el CSS y el JS referenciados y agrega el shim de consola", () => {
    const doc = buildPreviewDoc([html, css, js])!;
    expect(doc).toContain("h1{color:red}");
    expect(doc).toContain("console.log('ok')");
    expect(doc).not.toContain('href="./styles.css"');
    expect(doc).not.toContain('src="app.js"');
    expect(doc).toContain("__basalt");
  });

  it("inyecta el CSS/JS que el HTML no referencia", () => {
    const bare: ProjectFile = { name: "index.html", lang: "html", code: "<html><head></head><body><p>x</p></body></html>" };
    const doc = buildPreviewDoc([bare, css, js])!;
    expect(doc.indexOf("h1{color:red}")).toBeLessThan(doc.indexOf("</head>"));
    expect(doc.indexOf("console.log('ok')")).toBeLessThan(doc.indexOf("</body>"));
  });

  it("no inyecta JS de servidor/config y no rompe con </script> dentro del código", () => {
    const bare: ProjectFile = { name: "index.html", lang: "html", code: "<html><head></head><body></body></html>" };
    const server: ProjectFile = { name: "server.js", lang: "js", code: "require('express')" };
    const tricky: ProjectFile = { name: "app.js", lang: "js", code: "document.write('</script>')" };
    const doc = buildPreviewDoc([bare, server, tricky])!;
    expect(doc).not.toContain("express");
    expect(doc).toContain("<\\/script>");
  });

  it("envuelve un fragmento sin <html> en un documento completo", () => {
    const frag: ProjectFile = { name: "index.html", lang: "html", code: "<h1>solo un fragmento</h1>" };
    const doc = buildPreviewDoc([frag])!;
    expect(doc.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(doc).toContain("<h1>solo un fragmento</h1>");
  });
});

describe("stackblitzFields", () => {
  it("usa la plantilla node si hay package.json y html si es web estática", () => {
    const pkg: ProjectFile = { name: "package.json", lang: "json", code: "{}" };
    expect(stackblitzFields([pkg, html], "x")!["project[template]"]).toBe("node");
    expect(stackblitzFields([html, css], "x")!["project[template]"]).toBe("html");
    expect(stackblitzFields([html], "x")!["project[files][index.html]"]).toBe(html.code);
  });

  it("devuelve null si StackBlitz no puede ejecutar el proyecto", () => {
    expect(stackblitzFields([{ name: "main.py", lang: "py", code: "print(1)" }], "x")).toBeNull();
  });
});

describe("findMissingRefs y diagnóstico", () => {
  it("detecta archivos locales enlazados que nunca llegaron (respuesta cortada)", () => {
    expect(findMissingRefs([html])).toEqual(["styles.css", "app.js"]);
    expect(findMissingRefs([html, css, js])).toEqual([]);
  });

  it("ignora URLs externas, data: y anclas", () => {
    const ext: ProjectFile = {
      name: "index.html",
      lang: "html",
      code: '<html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter"><script src="//cdn.x/y.js"></script></head><body></body></html>',
    };
    expect(findMissingRefs([ext])).toEqual([]);
  });

  it("el preview avisa por consola qué archivo falta", () => {
    const doc = buildPreviewDoc([html])!;
    expect(doc).toContain("styles.css está enlazado en el HTML pero no llegó");
    expect(buildPreviewDoc([html, css, js])).not.toContain("no llegó");
  });
});

describe("withBasaltBase", () => {
  const linked: ProjectFile = {
    name: "index.html",
    lang: "html",
    code: '<html><head><link rel="stylesheet" href="basalt.css"><style>:root{--hue:45}</style></head><body><p>x</p></body></html>',
  };

  it("suma basalt.css como archivo real cuando el HTML lo enlaza", () => {
    const files = withBasaltBase([linked]);
    expect(files.map((f) => f.name)).toEqual(["index.html", "basalt.css"]);
    expect(files[1].code).toContain("@layer base, components");
  });

  it("no toca proyectos que no lo enlazan ni pisa uno que el modelo sí escribió", () => {
    expect(withBasaltBase([html, css, js])).toHaveLength(3);
    const own: ProjectFile = { name: "basalt.css", lang: "css", code: "/* propio */" };
    expect(withBasaltBase([linked, own])).toHaveLength(2);
  });

  it("el preview inlinea basalt.css ANTES del CSS propio (que así siempre gana)", () => {
    const doc = buildPreviewDoc(withBasaltBase([linked]))!;
    expect(doc.indexOf("@layer base")).toBeGreaterThan(-1);
    expect(doc.indexOf("@layer base")).toBeLessThan(doc.indexOf(":root{--hue:45}"));
    expect(findMissingRefs(withBasaltBase([linked]))).toEqual([]);
  });

  it("también avisa de <img src> locales que nunca llegaron", () => {
    const img: ProjectFile = { name: "index.html", lang: "html", code: '<html><head></head><body><img src="./img/pan.jpg" alt="pan"><img src="https://x.test/a.png" alt=""><img src="data:image/png;base64,AAA" alt=""></body></html>' };
    expect(findMissingRefs([img])).toEqual(["img/pan.jpg"]);
  });
});
