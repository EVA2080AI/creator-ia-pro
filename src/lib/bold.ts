// Lo que sabemos del formato de Bold (developers.bold.co, leído el 2026-11-22), sin red ni
// base: se puede probar entero y lo comparten el cobro, el aviso de pago y la conciliación.
//
// Vive en src/lib y sin imports por la misma razón que limits.ts: lo carga el API (node16)
// y lo prueban las pruebas de la app.

/** Bold le pone al link un id que "inicia por LNK_". Es lo que vuelve como referencia. */
const LINK_ID = /^LNK_[A-Za-z0-9_-]{1,60}$/;
export const isLinkId = (v: unknown): v is string => typeof v === "string" && LINK_ID.test(v);

// ── La compra pendiente ───────────────────────────────────────────────────────────────
// `transaction.description` de una fila bold_pending / bold_approved:
//   <producto>|<id del link>|<pesos cobrados>[|prueba]
// El tercer campo es nuevo (2026-11-22): guarda lo que se cobró DE VERDAD el día de la
// compra, así un cambio de precios posterior no altera lo que cuenta el panel financiero,
// y es contra lo que se compara el monto de un aviso de pago. El cuarto marca una compra
// hecha con llaves de prueba (solo un admin puede acreditarla): no es un ingreso.

/** Marca de una compra de prueba acreditada. */
export const TEST_MARK = "prueba";
export const isTestPurchase = (description: string | null | undefined) => (description ?? "").split("|")[3]?.trim() === TEST_MARK;

export interface PurchaseRef {
  packId: string;
  linkId: string;
  /** null en filas anteriores al tercer campo. */
  amountCop: number | null;
}

export function encodePurchase(packId: string, linkId: string, amountCop: number): string {
  return `${packId}|${linkId}|${Math.round(amountCop)}`;
}

export function decodePurchase(description: string | null | undefined): PurchaseRef | null {
  const [packId, linkId, amount] = (description ?? "").split("|").map((s) => s.trim());
  if (!packId || !isLinkId(linkId)) return null;
  const n = Number(amount);
  return { packId, linkId, amountCop: amount && Number.isFinite(n) && n > 0 ? n : null };
}

// ── El aviso (webhook) ────────────────────────────────────────────────────────────────
// Bold NO manda `status` ni `reference` sueltos. Manda:
//   { id, type: "SALE_APPROVED" | "SALE_REJECTED" | "VOID_APPROVED" | "VOID_REJECTED",
//     subject, source, data: { payment_id, amount: { total }, metadata: { reference }, … } }
// y la referencia de un pago hecho con un link creado por API es el id del link (LNK_…).
// El receptor anterior leía `data.status` y `data.reference`: con un aviso real respondía
// "Falta reference" y el pago se quedaba sin acreditar.

export interface BoldNotification {
  type: string;
  reference: string | null;
  paymentId: string | null;
  totalCop: number | null;
}

export function parseNotification(payload: unknown): BoldNotification | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as { type?: unknown; data?: unknown };
  if (typeof p.type !== "string" || !p.data || typeof p.data !== "object") return null;
  const d = p.data as { payment_id?: unknown; amount?: { total?: unknown } | null; metadata?: { reference?: unknown } | null };
  const reference = d.metadata?.reference;
  const total = d.amount?.total;
  return {
    type: p.type,
    reference: typeof reference === "string" && reference ? reference : null,
    paymentId: typeof d.payment_id === "string" ? d.payment_id : null,
    totalCop: typeof total === "number" && Number.isFinite(total) ? total : null,
  };
}

// ── El estado de un link (GET /online/link/v1/<id>) ───────────────────────────────────
// ACTIVE: se puede pagar (también después de un intento fallido) · PROCESSING: pago en
// curso · PAID · REJECTED · CANCELLED · EXPIRED.

export interface BoldLink {
  status: string;
  totalCop: number | null;
  /**
   * true: creado con llaves de prueba (Bold lo "aprueba" con una tarjeta de ejemplo que es
   * pública) · false: pago real · null: Bold no lo dijo. Quien acredita exige `false`: si
   * el campo falta o cambia de nombre, un pago de prueba NO se toma por real.
   */
  isSandbox: boolean | null;
}

export function parseLink(json: unknown): BoldLink | null {
  if (!json || typeof json !== "object") return null;
  const outer = json as { payload?: unknown };
  // La respuesta documentada es plana; crear el link responde dentro de `payload`. Se aceptan las dos.
  const o = (outer.payload && typeof outer.payload === "object" && "status" in outer.payload ? outer.payload : json) as {
    status?: unknown; total?: unknown; is_sandbox?: unknown;
  };
  if (typeof o.status !== "string" || !o.status) return null;
  return {
    status: o.status.toUpperCase(),
    totalCop: typeof o.total === "number" && Number.isFinite(o.total) ? o.total : null,
    isSandbox: o.is_sandbox === true ? true : o.is_sandbox === false ? false : null,
  };
}

/** Texto que el comprador lee en la página de pago de Bold (entre 2 y 100 caracteres). */
export function purchaseDescription(product: { id: string; credits: number; isPlan: boolean }): string {
  const credits = product.credits.toLocaleString("es-CO");
  const what = product.isPlan
    ? `Plan ${product.id.charAt(0).toUpperCase()}${product.id.slice(1)} · 30 días · ${credits} créditos`
    : `Recarga de ${credits} créditos`;
  return `Creator IA Pro · ${what}`.slice(0, 100);
}
