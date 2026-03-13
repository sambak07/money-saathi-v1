import { pgTable, text, serial, timestamp, real } from "drizzle-orm/pg-core";
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
});

export const insertFinancialProductSchema = createInsertSchema(financialProductsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertFinancialProduct = z.infer<typeof insertFinancialProductSchema>;
export type FinancialProduct = typeof financialProductsTable.$inferSelect;
