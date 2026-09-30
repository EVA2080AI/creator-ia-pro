import { describe, expect, it } from "vitest";
import { lightTextOnPhoto, scoreProject, undefinedVars } from "./css-rubric";
import { withBasaltBase, type ProjectFile } from "./project-preview";

const bare: ProjectFile = {
  name: "index.html",
  lang: "html",
  code: '<html><head><title>x</title></head><body><center><font color="red">Hola</font></center></body></html>',
};

const modern: ProjectFile = {
  name: "index.html",
  lang: "html",
  code: `<!DOCTYPE html><html lang="es"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Trigo</title>
<link rel="stylesheet" href="basalt.css"><style>:root{--hue:45}.x{font-family:Georgia}</style></head>
<body><main class="container section"><h1>Trigo</h1><p>Pan de masa madre</p><button class="btn">Pedir</button></main></body></html>`,
};

describe("scoreProject", () => {
  it("un HTML pelado con marcado antiguo saca casi nada", () => {
    const r = scoreProject([bare]);
    expect(r.total).toBe(12);
    // "images"/"vars"/"restraint" son chequeos negativos: pasan por vacío en una página sin CSS.
    const failed = r.checks.filter((c) => !c.pass).map((c) => c.id);
    expect(failed).toEqual(expect.arrayContaining(["tokens", "legacy", "fluid", "modern", "a11y", "styled"]));
  });

  it("con basalt.css el mismo proyecto pasa los chequeos de tokens, fluidez, modo oscuro y accesibilidad", () => {
    const r = scoreProject(withBasaltBase([modern]));
    const failed = r.checks.filter((c) => !c.pass).map((c) => c.id);
    expect(failed).toEqual([]);
    expect(r.score).toBe(12);
  });

  it("detecta una respuesta cortada: enlaza styles.css que nunca llegó", () => {
    const cut: ProjectFile = { name: "index.html", lang: "html", code: '<html><head><link rel="stylesheet" href="styles.css"></head><body><h1>x' };
    const r = scoreProject([cut]);
    expect(r.checks.find((c) => c.id === "complete")!.pass).toBe(false);
  });

  it("sin HTML todo falla", () => {
    expect(scoreProject([{ name: "a.css", lang: "css", code: "a{}" }]).score).toBe(0);
  });

  it("marca las fotos inventadas (Unsplash / rutas inexistentes) pero no el atributo placeholder", () => {
    const withPhoto: ProjectFile = { ...modern, code: modern.code.replace("<h1>", '<img src="https://images.unsplash.com/photo-1?w=800" alt="pan"><h1>') };
    expect(scoreProject(withBasaltBase([withPhoto])).checks.find((c) => c.id === "images")!.pass).toBe(false);
    const withInput: ProjectFile = { ...modern, code: modern.code.replace("<h1>", '<label>Nombre<input class="input" placeholder="Tu nombre"></label><h1>') };
    expect(scoreProject(withBasaltBase([withInput])).checks.find((c) => c.id === "images")!.pass).toBe(true);
  });

  it("detecta variables usadas pero nunca definidas (falla en silencio)", () => {
    const bad: ProjectFile = { ...modern, code: modern.code.replace(".x{font-family:Georgia}", ".x{color:var(--nunca-definida);background:var(--hue)}") };
    expect(undefinedVars('a{color:var(--x)} :root{--y:1} b{c:var(--y)} d{e:var(--z,red)}')).toEqual(["--x"]);
    expect(scoreProject(withBasaltBase([bad])).checks.find((c) => c.id === "vars")!.pass).toBe(false);
    expect(scoreProject(withBasaltBase([modern])).checks.find((c) => c.id === "vars")!.pass).toBe(true);
  });
});

describe("lightTextOnPhoto", () => {
  it("detecta texto blanco sobre una foto sin respaldo (el hero invisible)", () => {
    expect(lightTextOnPhoto(".hero{background-image:url('https://x.test/a.jpg');color:white;}")).toBe(true);
    expect(lightTextOnPhoto(".hero{background:url(a.jpg) center/cover;color:#fff}")).toBe(true);
  });
  it("no acusa cuando hay degradado o color de fondo, ni cuando el texto es oscuro", () => {
    expect(lightTextOnPhoto(".hero{background:linear-gradient(#000,#333),url(a.jpg);color:#fff}")).toBe(false);
    expect(lightTextOnPhoto(".hero{background-color:#111;background-image:url(a.jpg);color:white}")).toBe(false);
    expect(lightTextOnPhoto(".hero{background-image:url(a.jpg);color:#111}")).toBe(false);
    expect(lightTextOnPhoto(".x{background-color:white;background-image:url(a.jpg)}")).toBe(false);
  });
});
