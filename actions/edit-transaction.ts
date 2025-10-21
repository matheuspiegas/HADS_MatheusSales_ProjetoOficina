"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse } from "@/schemas";
import { Database } from "@/schemas/database.types";

export interface ProcessedTransactionData {
  name: string;
  type: "income" | "expense";
  amount: number;
  transaction_date: string;
  month: number;
  transaction_category_id: string | null;
}

const editTransactionAction = async (
  user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
  { id, data }: { id: string; data: ProcessedTransactionData },
): Promise<ActionsResponse<null>> => {
  try {
    const { error } = await supabase
      .from("transactions")
      .update({
        name: data.name,
        type: data.type,
        amount: data.amount,
        transaction_date: data.transaction_date,
        month: data.month,
        transaction_category_id: data.transaction_category_id,
      })
      .eq("id", id);

    if (error) {
      return {
        success: false,
        error:
          error.message || "Could not update transaction. Please try again.",
      };
    }

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message || "An unexpected error occurred.",
    };
  }
};

export const editTransaction = async (
  id: string,
  data: ProcessedTransactionData,
) => {
  return withAuth(editTransactionAction, { id, data });
};
