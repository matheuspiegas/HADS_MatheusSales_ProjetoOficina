"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { withAuth } from "@/lib/with-auth";
import {
  ActionsResponse,
  Category,
  ReportData,
  ReportSummary,
} from "@/schemas";
import { Database } from "@/schemas/database.types";

interface ReportFilters {
  categories?: {
    label: string;
    value: string;
  }[];
  type?: "income" | "expense" | "all";
  date?: {
    from?: string;
    to?: string;
  };
}

const generateReportAction = async (
  user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
  args?: ReportFilters,
): Promise<ActionsResponse<ReportSummary>> => {
  try {
    // Construir a query base com joins (left join para incluir transações sem categoria)
    let query = supabase.from("transactions").select(`
        id,
        name,
        amount,
        type,
        transaction_date,
        month,
        created_at,
        transaction_categories (
          id,
          name,
          description
        )
      `);

    // Aplicar filtro de tipo se especificado (se for "all", não aplica filtro)
    if (args?.type && args.type !== "all") {
      query = query.eq("type", args.type);
    }

    // Aplicar filtro de categorias se especificado
    if (args?.categories && args.categories.length > 0) {
      const categoryIds = args.categories.map((cat) => cat.value);
      query = query.in("transaction_category_id", categoryIds);
    }

    // Aplicar filtro de data se especificado
    if (args?.date?.from && args?.date?.to) {
      query = query
        .gte("transaction_date", args.date.from)
        .lte("transaction_date", args.date.to);
    } else if (args?.date?.from) {
      query = query.gte("transaction_date", args.date.from);
    } else if (args?.date?.to) {
      query = query.lte("transaction_date", args.date.to);
    }

    // Ordenar por data mais recente
    query = query.order("transaction_date", { ascending: false });

    // Executar a query
    const { data: transactions, error } = await query;

    if (error) {
      console.error("Erro ao buscar transações:", error);
      return {
        success: false,
        error: "Erro ao buscar transações para o relatório.",
      };
    }

    if (!transactions || transactions.length === 0) {
      return {
        success: true,
        data: {
          totalTransactions: 0,
          totalIncome: 0,
          totalExpense: 0,
          netAmount: 0,
          transactions: [],
        },
      };
    }

    // Transformar dados para o formato esperado
    const reportData: ReportData[] = transactions.map((transaction) => ({
      id: transaction.id,
      name: transaction.name,
      amount: transaction.amount,
      type: transaction.type,
      transaction_date: transaction.transaction_date,
      month: transaction.month,
      created_at: transaction.created_at,
      category: transaction.transaction_categories
        ? {
            id: transaction.transaction_categories.id,
            name: transaction.transaction_categories.name,
            description: transaction.transaction_categories.description,
          }
        : null,
    }));

    // Calcular resumo
    const totalIncome = reportData
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = reportData
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const netAmount = totalIncome - totalExpense;

    const summary: ReportSummary = {
      totalTransactions: reportData.length,
      totalIncome,
      totalExpense,
      netAmount,
      transactions: reportData,
    };

    return {
      success: true,
      data: summary,
    };
  } catch (error) {
    console.error("Erro inesperado ao gerar relatório:", error);
    return {
      success: false,
      error:
        (error instanceof Error
          ? error.message
          : "An unexpected error occurred.") ||
        "Erro inesperado ao gerar relatório. Tente novamente.",
    };
  }
};

export async function generateReport(args: ReportFilters) {
  return withAuth(generateReportAction, args);
}

export type { ReportData, ReportFilters, ReportSummary };
