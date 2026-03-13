import { pgTable, serial, integer, timestamp, doublePrecision, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  totalIncome: doublePrecision("total_income").notNull(),
  totalExpenses: doublePrecision("total_expenses").notNull(),
  totalSavings: doublePrecision("total_savings").notNull(),
  totalDebt: doublePrecision("total_debt").notNull(),
  netSavings: doublePrecision("net_savings").notNull(),
  financialScore: doublePrecision("financial_score").notNull(),
  scoreCategory: text("score_category").notNull(),
  recommendations: text("recommendations").array().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertReportSchema = createInsertSchema(reportsTable).omit({ id: true, createdAt: true });
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reportsTable.$inferSelect;
