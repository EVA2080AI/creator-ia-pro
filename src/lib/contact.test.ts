import { describe, expect, it } from "vitest";
import { validarContacto } from "./contact";

const ok = { name: "Ana", email: "ana@dominio.com", subject: "Hola", message: "Tengo una duda sobre los planes." };

describe("validarContacto", () => {
  it("acepta un mensaje normal", () => {
    expect(validarContacto(ok)).toBeNull();
  });
  it("rechaza correo inválido, campos vacíos y topes", () => {
    expect(validarContacto({ ...ok, email: "no-es-correo" })).toMatch(/correo/);
    expect(validarContacto({ ...ok, name: "" })).toMatch(/nombre/);
    expect(validarContacto({ ...ok, subject: "" })).toMatch(/asunto/i);
    expect(validarContacto({ ...ok, message: "corto" })).toMatch(/más/);
    expect(validarContacto({ ...ok, message: "x".repeat(5001) })).toMatch(/5\.000/);
    expect(validarContacto({})).not.toBeNull();
  });
  it("recorta espacios antes de validar", () => {
    expect(validarContacto({ ...ok, name: "  Ana  ", email: " ana@dominio.com " })).toBeNull();
  });
});
