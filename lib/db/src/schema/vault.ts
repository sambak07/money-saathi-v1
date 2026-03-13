import { pgTable, serial, integer, text, doublePrecision, timestamp, varchar, date } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const vaultBankAccountsTable = pgTable("vault_bank_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  institution: text("institution").notNull(),
  accountNickname: text("account_nickname").notNull(),
  accountType: text("account_type").notNull(),
  maskedAccountNumber: text("masked_account_number"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const vaultFixedDepositsTable = pgTable("vault_fixed_deposits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  institution: text("institution").notNull(),
  depositAmount: doublePrecision("deposit_amount").notNull(),
  interestRate: text("interest_rate").notNull(),
  startDate: date("start_date").notNull(),
  maturityDate: date("maturity_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const vaultLoansTable = pgTable("vault_loans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  bank: text("bank").notNull(),
  loanType: text("loan_type").notNull(),
  outstandingAmount: doublePrecision("outstanding_amount").notNull(),
  emi: doublePrecision("emi").notNull(),
  interestRate: text("interest_rate").notNull(),
  remainingTenure: text("remaining_tenure").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const vaultInsuranceTable = pgTable("vault_insurance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  insurer: text("insurer").notNull(),
  policyType: text("policy_type").notNull(),
  premiumAmount: doublePrecision("premium_amount").notNull(),
  premiumDueDate: date("premium_due_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const vaultInvestmentsTable = pgTable("vault_investments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  investmentType: text("investment_type").notNull(),
  institution: text("institution").notNull(),
  amount: doublePrecision("amount").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
