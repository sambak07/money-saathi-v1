import { pgTable, serial, integer, timestamp, doublePrecision, varchar, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const financialSnapshotsTable = pgTable("financial_snapshots", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  month: varchar("month", { length: 7 }).notNull(),
  totalIncome: doublePrecision("total_income").notNull().default(0),
  totalExpenses: doublePrecision("total_expenses").notNull().default(0),
  totalSavings: doublePrecision("total_savings").notNull().default(0),
  totalObligations: doublePrecision("total_obligations").notNull().default(0),
  debtRatio: doublePrecision("debt_ratio").notNull().default(0),
  financialScore: doublePrecision("financial_score").notNull().default(0),
  emergencyFundMonths: doublePrecision("emergency_fund_months").notNull().default(0),
  profitMargin: doublePrecision("profit_margin").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("financial_snapshots_user_month").on(table.userId, table.month),
]);

export type FinancialSnapshot = typeof financialSnapshotsTable.$inferSelect;
