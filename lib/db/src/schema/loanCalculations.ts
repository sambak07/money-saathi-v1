import { pgTable, serial, integer, timestamp, doublePrecision, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const loanCalculationsTable = pgTable("loan_calculations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  loanAmount: doublePrecision("loan_amount").notNull(),
  interestRate: doublePrecision("interest_rate").notNull(),
  tenureMonths: integer("tenure_months").notNull(),
  emi: doublePrecision("emi").notNull(),
  totalPayment: doublePrecision("total_payment").notNull(),
  totalInterest: doublePrecision("total_interest").notNull(),
  safeEmiMin: doublePrecision("safe_emi_min").notNull(),
  safeEmiMax: doublePrecision("safe_emi_max").notNull(),
  affordabilityStatus: text("affordability_status").notNull(),
  healthScoreImpact: doublePrecision("health_score_impact").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLoanCalcSchema = createInsertSchema(loanCalculationsTable).omit({ id: true, createdAt: true });
export type InsertLoanCalc = z.infer<typeof insertLoanCalcSchema>;
export type LoanCalculation = typeof loanCalculationsTable.$inferSelect;
