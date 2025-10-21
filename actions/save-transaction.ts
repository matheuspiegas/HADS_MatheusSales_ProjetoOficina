"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse } from "@/schemas";
import { Database } from "@/schemas/database.types";

type SaveTransaction = {
  amount: number;
  month: number;
  name: string;
  transaction_category_id?: string | null;
  transaction_date: string;
  type: "income" | "expense";
};

export const saveTransactionAction = async (
  user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
  data: SaveTransaction,
): Promise<ActionsResponse<SaveTransaction>> => {
  const { data: newTransaction, error } = await supabase
    .from("transactions")
    .insert({
      type: data.type,
      name: data.name,
      amount: data.amount,
      month: data.month,
      transaction_date: data.transaction_date,
      transaction_category_id: data.transaction_category_id || null,
    })
    .select();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  if (!newTransaction || newTransaction.length === 0) {
    return {
      success: false,
      error: "Failed to create transaction",
    };
  }

  return {
    success: true,
    data: newTransaction[0],
  };
};

export const saveTransaction = async (data: SaveTransaction) => {
  return withAuth(saveTransactionAction, data);
};
