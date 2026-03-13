import { useQueryClient } from "@tanstack/react-query";
import {
  useGetDashboard,
  getGetDashboardQueryKey,
  useCreateIncomeEntry,
  useUpdateIncomeEntry,
  useDeleteIncomeEntry,
  getGetIncomeEntriesQueryKey,
  useCreateExpenseEntry,
  useUpdateExpenseEntry,
  useDeleteExpenseEntry,
  getGetExpenseEntriesQueryKey,
  useCreateObligation,
  useUpdateObligation,
  useDeleteObligation,
  getGetObligationsQueryKey,
  useCreateSavingsEntry,
  useUpdateSavingsEntry,
  useDeleteSavingsEntry,
  getGetSavingsEntriesQueryKey,
  useCalculateFinancialScore,
  getGetFinancialScoreQueryKey,
  useCalculateLoan,
  getGetLoanCalculationsQueryKey,
  useGenerateReport,
  getGetReportsQueryKey,
  useCreateProfile,
  getGetProfileQueryKey
} from "@workspace/api-client-react";

// Helper to invalidate all finance-related queries
export function useInvalidateFinance() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
    qc.invalidateQueries({ queryKey: getGetFinancialScoreQueryKey() });
    qc.invalidateQueries({ queryKey: getGetIncomeEntriesQueryKey() });
    qc.invalidateQueries({ queryKey: getGetExpenseEntriesQueryKey() });
    qc.invalidateQueries({ queryKey: getGetObligationsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetSavingsEntriesQueryKey() });
  };
}

export function useFinanceMutations() {
  const invalidateAll = useInvalidateFinance();
  const qc = useQueryClient();

  // Profile
  const createProfile = useCreateProfile({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getGetProfileQueryKey() }) }
  });

  // Income
  const createIncome = useCreateIncomeEntry({ mutation: { onSuccess: invalidateAll } });
  const updateIncome = useUpdateIncomeEntry({ mutation: { onSuccess: invalidateAll } });
  const deleteIncome = useDeleteIncomeEntry({ mutation: { onSuccess: invalidateAll } });

  // Expenses
  const createExpense = useCreateExpenseEntry({ mutation: { onSuccess: invalidateAll } });
  const updateExpense = useUpdateExpenseEntry({ mutation: { onSuccess: invalidateAll } });
  const deleteExpense = useDeleteExpenseEntry({ mutation: { onSuccess: invalidateAll } });

  // Obligations
  const createObligation = useCreateObligation({ mutation: { onSuccess: invalidateAll } });
  const updateObligation = useUpdateObligation({ mutation: { onSuccess: invalidateAll } });
  const deleteObligation = useDeleteObligation({ mutation: { onSuccess: invalidateAll } });

  // Savings
  const createSavings = useCreateSavingsEntry({ mutation: { onSuccess: invalidateAll } });
  const updateSavings = useUpdateSavingsEntry({ mutation: { onSuccess: invalidateAll } });
  const deleteSavings = useDeleteSavingsEntry({ mutation: { onSuccess: invalidateAll } });

  // Score & Reports
  const calculateScore = useCalculateFinancialScore({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getGetFinancialScoreQueryKey() }) }
  });
  
  const calculateLoan = useCalculateLoan({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getGetLoanCalculationsQueryKey() }) }
  });

  const generateReport = useGenerateReport({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getGetReportsQueryKey() }) }
  });

  return {
    createProfile,
    createIncome, updateIncome, deleteIncome,
    createExpense, updateExpense, deleteExpense,
    createObligation, updateObligation, deleteObligation,
    createSavings, updateSavings, deleteSavings,
    calculateScore, calculateLoan, generateReport
  };
}
