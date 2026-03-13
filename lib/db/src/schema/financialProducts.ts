import { pgTable, text, serial, timestamp, real, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const financialProductsTable = pgTable("financial_products", {
  id: serial("id").primaryKey(),
  institutionName: text("institution_name").notNull(),
  productCategory: text("product_category").notNull(),
  productName: text("product_name").notNull(),
  interestRate: text("interest_rate"),
  minimumBalance: text("minimum_balance"),
  tenure: text("tenure"),
  fees: text("fees"),
  keyFeatures: text("key_features"),
  sourceUrl: text("source_url"),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),

  interestRateMin: real("interest_rate_min"),
  interestRateMax: real("interest_rate_max"),
  minimumBalanceValue: real("minimum_balance_value"),
  tenureMonthsMin: integer("tenure_months_min"),
  tenureMonthsMax: integer("tenure_months_max"),
  feeValue: real("fee_value"),

  productSubcategory: text("product_subcategory"),
  targetSegment: text("target_segment"),
  currency: text("currency").default("BTN"),
  isActive: boolean("is_active").default(true),
});

export const insertFinancialProductSchema = createInsertSchema(financialProductsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertFinancialProduct = z.infer<typeof insertFinancialProductSchema>;
export type FinancialProduct = typeof financialProductsTable.$inferSelect;
