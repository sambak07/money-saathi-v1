import { pgTable, text, serial, integer, timestamp, doublePrecision, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const savingsTable = pgTable("savings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  name: text("name").notNull(),
  category: text("category"),
  amount: doublePrecision("amount").notNull(),
  savingsType: text("savings_type").notNull(),
  institution: text("institution"),
  monthlyContribution: doublePrecision("monthly_contribution"),
  expectedReturn: doublePrecision("expected_return"),
  startDate: date("start_date"),
  maturityDate: date("maturity_date"),
  linkedGoal: text("linked_goal"),
  description: text("description"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSavingsSchema = createInsertSchema(savingsTable).omit({ id: true, createdAt: true });
export type InsertSavings = z.infer<typeof insertSavingsSchema>;
export type Savings = typeof savingsTable.$inferSelect;
