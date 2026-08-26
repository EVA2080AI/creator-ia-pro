// Transacciones de créditos/pagos — portado desde la tabla `transactions` de
// Supabase (usada por bold-checkout/bold-webhook). Ver api/billing/*.
import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { user } from "./auth.js";

export const transactionType = pgEnum("transaction_type", [
  "purchase",
  "spend",
  "admin_grant",
  "admin_deduct",
  "refund",
  "bold_pending",
  "bold_approved",
  "subscription_change",
]);

export const transaction = pgTable("transaction", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  type: transactionType("type").notNull(),
  /** Créditos otorgados/gastados (0 mientras un pago Bold está pendiente de confirmar). */
  amount: integer("amount").notNull().default(0),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
