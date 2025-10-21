"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse } from "@/schemas";
import { Database } from "@/schemas/database.types";

export type TransactionCategory = {
  id: string;
  name: string;
} | null;

const getTransactionCategoriesAction = async (
  user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
): Promise<ActionsResponse<TransactionCategory[]>> => {
  try {
    const { data, error } = await supabase
      .from("transaction_categories")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      return {
        success: false,
        error:
          error.message ||
          "Could not fetch transaction categories. Please try again.",
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message || "An unexpected error occurred.",
    };
  }
};

export const getTransactionCategories = async () => {
  return withAuth(getTransactionCategoriesAction);
};
