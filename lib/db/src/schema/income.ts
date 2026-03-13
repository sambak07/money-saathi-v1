import { pgTable, text, serial, integer, timestamp, doublePrecision, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const incomeEntriesTable = pgTable("income_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  source: text("source").notNull(),
  category: text("category"),
  amount: doublePrecision("amount").notNull(),
  frequency: text("frequency").notNull(),
  date: date("date"),
  description: text("description"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertIncomeSchema = createInsertSchema(incomeEntriesTable).omit({ id: true, createdAt: true });
export type InsertIncome = z.infer<typeof insertIncomeSchema>;
export type IncomeEntry = typeof incomeEntriesTable.$inferSelect;
