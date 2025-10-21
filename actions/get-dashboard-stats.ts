"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse } from "@/schemas";
import { Database } from "@/schemas/database.types";

interface QuotesStats {
  currentMonthCount: number;
  previousMonthCount: number;
  percentageChange: number;
}

interface RevenueStats {
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  percentageChange: number;
}

export interface DashboardStats {
  quotes: QuotesStats;
  revenue: RevenueStats;
}

const getDashboardStatsAction = async (
  user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
): Promise<ActionsResponse<DashboardStats>> => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  try {
    // Calcular datas no formato yyyy-mm-dd (sem horário para evitar problemas de fuso)
    const currentMonthStartDate = `${currentYear}-${currentMonth.toString().padStart(2, "0")}-01`;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    const currentMonthEndDate = `${nextMonthYear}-${nextMonth.toString().padStart(2, "0")}-01`;

    const previousMonthStartDate = `${previousYear}-${previousMonth.toString().padStart(2, "0")}-01`;
    const previousMonthEndDate = `${currentYear}-${currentMonth.toString().padStart(2, "0")}-01`; // Buscar orçamentos do mês atual
    const { data: currentQuotes, error: currentQuotesError } = await supabase
      .from("quotes")
      .select("id, total_price, created_at")
      .gte("created_at", currentMonthStartDate)
      .lt("created_at", currentMonthEndDate);

    if (currentQuotesError) {
      console.error(
        "Erro ao buscar orçamentos do mês atual:",
        currentQuotesError,
      );
      throw currentQuotesError;
    }

    // Buscar orçamentos do mês anterior
    const { data: previousQuotes, error: previousQuotesError } = await supabase
      .from("quotes")
      .select("id, total_price, created_at")
      .gte("created_at", previousMonthStartDate)
      .lt("created_at", previousMonthEndDate);

    if (previousQuotesError) {
      console.error(
        "Erro ao buscar orçamentos do mês anterior:",
        previousQuotesError,
      );
      throw previousQuotesError;
    }

    // Calcular estatísticas de orçamentos
    const currentMonthCount = currentQuotes?.length || 0;
    const previousMonthCount = previousQuotes?.length || 0;

    const quotesPercentageChange =
      previousMonthCount === 0
        ? currentMonthCount > 0
          ? 100
          : 0
        : Math.round(
            ((currentMonthCount - previousMonthCount) / previousMonthCount) *
              100,
          );

    // Calcular receita
    const currentMonthRevenue =
      currentQuotes?.reduce((sum, quote) => sum + quote.total_price, 0) || 0;
    const previousMonthRevenue =
      previousQuotes?.reduce((sum, quote) => sum + quote.total_price, 0) || 0;

    const revenuePercentageChange =
      previousMonthRevenue === 0
        ? currentMonthRevenue > 0
          ? 100
          : 0
        : Math.round(
            ((currentMonthRevenue - previousMonthRevenue) /
              previousMonthRevenue) *
              100,
          );

    return {
      success: true,
      data: {
        quotes: {
          currentMonthCount,
          previousMonthCount,
          percentageChange: quotesPercentageChange,
        },
        revenue: {
          currentMonthRevenue,
          previousMonthRevenue,
          percentageChange: revenuePercentageChange,
        },
      },
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas do dashboard:", error);

    return {
      success: false,
      error:
        (error instanceof Error
          ? error.message
          : "An unexpected error occurred.") ||
        "Could not fetch dashboard stats. Please try again.",
    };
  }
};

export async function getDashboardStats() {
  return withAuth(getDashboardStatsAction);
}
