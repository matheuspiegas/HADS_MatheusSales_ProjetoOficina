"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse } from "@/schemas";
import { Database } from "@/schemas/database.types";

interface RecentActivity {
  id: string;
  type: "quote" | "transaction";
  description: string;
  time: string;
  amount?: number;
  client_name?: string;
  created_at?: string | null; // Para ordenação interna
}

export interface RecentActivitiesData {
  activities: RecentActivity[];
}

const getRecentActivitiesAction = async (
  user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
): Promise<ActionsResponse<RecentActivitiesData>> => {
  try {
    // Buscar últimos 3 orçamentos criados
    const { data: quotes, error: quotesError } = await supabase
      .from("quotes")
      .select("id, client_name, total_price, created_at")
      .order("created_at", { ascending: false })
      .limit(3);

    if (quotesError) {
      console.error("Erro ao buscar orçamentos recentes:", quotesError);
    }

    // Buscar últimas 3 transações
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("id, name, amount, type, created_at")
      .order("created_at", { ascending: false })
      .limit(3);

    if (transactionsError) {
      console.error("Erro ao buscar transações recentes:", transactionsError);
    }

    // Função para calcular tempo relativo
    const getRelativeTime = (dateString: string): string => {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMinutes < 60) {
        return diffMinutes <= 1 ? "agora" : `${diffMinutes} minutos atrás`;
      } else if (diffHours < 24) {
        return diffHours === 1 ? "1 hora atrás" : `${diffHours} horas atrás`;
      } else {
        return diffDays === 1 ? "1 dia atrás" : `${diffDays} dias atrás`;
      }
    };

    // Processar orçamentos
    const quoteActivities: RecentActivity[] = (quotes || []).map((quote) => ({
      id: `quote-${quote.id}`,
      type: "quote" as const,
      description: `Novo orçamento criado para ${quote.client_name}`,
      time: getRelativeTime(quote.created_at),
      amount: quote.total_price,
      client_name: quote.client_name,
      created_at: quote.created_at, // Adicionar data para ordenação
    }));

    // Processar transações
    const transactionActivities: RecentActivity[] = (transactions || []).map(
      (transaction) => ({
        id: `transaction-${transaction.id}`,
        type: "transaction" as const,
        description:
          transaction.type === "income"
            ? `Receita recebida - ${transaction.name}`
            : `Despesa registrada - ${transaction.name}`,
        time: getRelativeTime(transaction.created_at || ""),
        amount: transaction.amount,
        created_at: transaction.created_at, // Adicionar data para ordenação
      }),
    );

    // Combinar e ordenar por data mais recente
    const allActivities = [...quoteActivities, ...transactionActivities];

    // Ordenar por data de criação (mais recente primeiro) e limitar a 5
    const sortedActivities = allActivities
      .sort((a, b) => {
        // Usar as datas reais para ordenação precisa
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();

        // Ordenar do mais recente para o mais antigo
        return dateB - dateA;
      })
      .slice(0, 5); // Limitar a 5 atividades

    // Remover created_at dos objetos antes de retornar (não é necessário no frontend)
    const activitiesWithoutDate = sortedActivities.map(
      ({ created_at, ...activity }) => activity,
    );

    return {
      success: true,
      data: {
        activities: activitiesWithoutDate,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar atividades recentes:", error);

    return {
      success: false,
      error:
        (error instanceof Error
          ? error.message
          : "An unexpected error occurred.") ||
        "Could not fetch recent activities. Please try again.",
    };
  }
};

export async function getRecentActivities() {
  return withAuth(getRecentActivitiesAction);
}
