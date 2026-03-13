import { pgTable, text, serial, integer, timestamp, doublePrecision, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const obligationsTable = pgTable("obligations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  name: text("name").notNull(),
  category: text("category"),
  totalAmount: doublePrecision("total_amount").notNull(),
  monthlyPayment: doublePrecision("monthly_payment").notNull(),
  interestRate: doublePrecision("interest_rate"),
  remainingTenure: integer("remaining_tenure"),
  obligationType: text("obligation_type").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  nextDueDate: date("next_due_date"),
  priority: text("priority"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertObligationSchema = createInsertSchema(obligationsTable).omit({ id: true, createdAt: true });
export type InsertObligation = z.infer<typeof insertObligationSchema>;
export type Obligation = typeof obligationsTable.$inferSelect;
