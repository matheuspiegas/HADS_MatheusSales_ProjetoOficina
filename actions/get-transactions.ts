"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse } from "@/schemas";
import { Database } from "@/schemas/database.types";

export interface Transactions {
  amount: number;
  created_at: string | null;
  id: string;
  month: number;
  name: string;
  transaction_date: string;
  type: "income" | "expense";
  transaction_category_id: string | null;
  transaction_categories: { name: string } | null;
}

interface GetTransactionsFilters {
  type: string | null;
  categories: string | null;
  from: string | null;
  to: string | null;
  page: string | null;
}

const getTransactionsAction = async (
  user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
  args: { filters: GetTransactionsFilters },
): Promise<
  ActionsResponse<{ transactions: Transactions[]; totalPages: number }>
> => {
  try {
    const page = args.filters.page ? parseInt(args.filters.page) : 1;
    const perPage = 10;
    const start = (page - 1) * perPage;
    const end = page * perPage - 1;

    let query = supabase
      .from("transactions")
      .select("*, transaction_categories(name)", { count: "exact" });

    if (args.filters?.categories && args.filters.categories !== "all") {
      query = query.eq("transaction_category_id", args.filters.categories);
    }
    if (args.filters?.type && args.filters.type !== "all") {
      if (args.filters.type === "income" || args.filters.type === "expense") {
        query = query.eq("type", args.filters?.type);
      }
    }
    if (args.filters?.from && args.filters?.to) {
      query = query
        .gte("transaction_date", args.filters.from)
        .lte("transaction_date", args.filters.to);
    }

    const { data, error, count } = await query
      .order("created_at", {
        ascending: false,
      })
      .range(start, end);

    if (error) {
      return {
        success: false,
        error:
          error.message || "Could not fetch transactions. Please try again.",
      };
    }

    const totalPages = count ? Math.ceil(count / perPage) : 0;

    return {
      success: true,
      data: { transactions: data || [], totalPages },
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message || "An unexpected error occurred.",
    };
  }
};

export const getTransactions = async (filters: GetTransactionsFilters) => {
  return withAuth(getTransactionsAction, { filters });
};
