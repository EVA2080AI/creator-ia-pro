import { describe, expect, it } from "vitest";
import {
  GH_MAX_ARCHIVOS, GH_MAX_CHARS_ARCHIVO, GH_MAX_CHARS_TOTAL,
  readmePorDefecto, sanitizeRepoName, tieneReadme, tieneRepoScope, validarArchivos,
} from "./github-export";

describe("sanitizeRepoName", () => {
  it("convierte un título de proyecto real en un nombre válido", () => {
    expect(sanitizeRepoName("Cafetería «El Buen Día» — menú")).toBe("Cafeteria-El-Buen-Dia-menu");
  });
  it("no deja puntos ni guiones en los bordes (GitHub los rechaza o los afea)", () => {
    expect(sanitizeRepoName("...mi proyecto---")).toBe("mi-proyecto");
    expect(sanitizeRepoName("-.-")).toBe("proyecto-creator-ia");
  });
  it("respeta nombres ya válidos, con puntos internos incluidos", () => {
    expect(sanitizeRepoName("mi-app.v2")).toBe("mi-app.v2");
  });
  it("recorta a 100 caracteres sin dejar borde sucio", () => {
    const largo = "a".repeat(99) + "-b";
    const r = sanitizeRepoName(largo);
    expect(r.length).toBeLessThanOrEqual(100);
    expect(r.endsWith("-")).toBe(false);
  });
  it("con título vacío cae al nombre por defecto", () => {
    expect(sanitizeRepoName("")).toBe("proyecto-creator-ia");
    expect(sanitizeRepoName("🥖🥖")).toBe("proyecto-creator-ia");
  });
});

describe("tieneRepoScope", () => {
  it("entiende el formato de GitHub (comas) y el de better-auth (espacios)", () => {
    expect(tieneRepoScope("read:user,user:email,repo")).toBe(true);
    expect(tieneRepoScope("read:user user:email repo")).toBe(true);
  });
  it("no confunde subcadenas como repo:status o public_repo", () => {
    expect(tieneRepoScope("public_repo,read:user")).toBe(false);
    expect(tieneRepoScope("repo:status")).toBe(false);
    expect(tieneRepoScope(null)).toBe(false);
  });
});

describe("validarArchivos", () => {
  const ok = [{ path: "index.html", content: "<h1>hola</h1>" }];
  it("acepta un proyecto normal", () => {
    expect(validarArchivos(ok)).toBeNull();
  });
  it("rechaza vacío, rutas que escapan y .git", () => {
    expect(validarArchivos([])).toMatch(/No hay archivos/);
    expect(validarArchivos([{ path: "../fuera.txt", content: "x" }])).toMatch(/inválida/);
    expect(validarArchivos([{ path: "/abs.txt", content: "x" }])).toMatch(/inválida/);
    expect(validarArchivos([{ path: ".git/config", content: "x" }])).toMatch(/inválida/);
    expect(validarArchivos([{ path: "a//b.txt", content: "x" }])).toMatch(/inválida/);
  });
  it("rechaza duplicados y topes", () => {
    expect(validarArchivos([ok[0], ok[0]])).toMatch(/repetido/);
    const muchos = Array.from({ length: GH_MAX_ARCHIVOS + 1 }, (_, i) => ({ path: `f${i}.txt`, content: "x" }));
    expect(validarArchivos(muchos)).toMatch(/Máximo/);
    expect(validarArchivos([{ path: "grande.js", content: "x".repeat(GH_MAX_CHARS_ARCHIVO + 1) }])).toMatch(/supera/);
    const seisGrandes = Array.from({ length: 6 }, (_, i) => ({ path: `g${i}.js`, content: "x".repeat(GH_MAX_CHARS_TOTAL / 5) }));
    expect(validarArchivos(seisGrandes)).toMatch(/tamaño máximo/);
  });
});

describe("README", () => {
  it("detecta README existente sin importar mayúsculas", () => {
    expect(tieneReadme([{ path: "ReadMe.MD", content: "" }])).toBe(true);
    expect(tieneReadme([{ path: "docs/README.md", content: "" }])).toBe(false);
  });
  it("el README por defecto nombra el proyecto y a Creator IA", () => {
    const r = readmePorDefecto("Mi tienda");
    expect(r).toMatch(/# Mi tienda/);
    expect(r).toMatch(/creator-ia\.com/);
  });
});
