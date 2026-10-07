import { describe, expect, it } from "vitest";
import { safeInternalPath } from "./safe-path";

describe("safeInternalPath", () => {
  it("acepta rutas internas, con query incluida", () => {
    expect(safeInternalPath("/apps/enhance")).toBe("/apps/enhance");
    expect(safeInternalPath("/a/basalt?panel=tools&tool=generate")).toBe("/a/basalt?panel=tools&tool=generate");
  });

  it("sin valor cae al fallback", () => {
    expect(safeInternalPath(null)).toBe("/a/basalt");
    expect(safeInternalPath("")).toBe("/a/basalt");
    expect(safeInternalPath(null, "/formarketing")).toBe("/formarketing");
  });

  it("rechaza todo lo que saldría del sitio (open redirect)", () => {
    expect(safeInternalPath("https://evil.com")).toBe("/a/basalt");
    expect(safeInternalPath("//evil.com/apps")).toBe("/a/basalt");
    expect(safeInternalPath("javascript:alert(1)")).toBe("/a/basalt");
    expect(safeInternalPath("apps/enhance")).toBe("/a/basalt");
  });
});
