import { pgTable, serial, integer, timestamp, doublePrecision, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const financialScoresTable = pgTable("financial_scores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  totalScore: doublePrecision("total_score").notNull(),
  category: text("category").notNull(),
  savingsRatio: doublePrecision("savings_ratio").notNull(),
  debtRatio: doublePrecision("debt_ratio").notNull(),
  emergencyFundCoverage: doublePrecision("emergency_fund_coverage").notNull(),
  expenseRatio: doublePrecision("expense_ratio").notNull(),
  savingsScore: doublePrecision("savings_score").notNull(),
  debtScore: doublePrecision("debt_score").notNull(),
  emergencyScore: doublePrecision("emergency_score").notNull(),
  expenseScore: doublePrecision("expense_score").notNull(),
  calculatedAt: timestamp("calculated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFinancialScoreSchema = createInsertSchema(financialScoresTable).omit({ id: true, calculatedAt: true });
export type InsertFinancialScore = z.infer<typeof insertFinancialScoreSchema>;
export type FinancialScore = typeof financialScoresTable.$inferSelect;
