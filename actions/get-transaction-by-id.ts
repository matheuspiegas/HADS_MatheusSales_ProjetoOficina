"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse, Transaction } from "@/schemas";
import { Database } from "@/schemas/database.types";

const getTransactionByIdAction = async (
  user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<
  ActionsResponse<Database["public"]["Tables"]["transactions"]["Row"]>
> => {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return {
        success: false,
        error:
          error.message || "Could not fetch transaction. Please try again.",
      };
    }

    if (!data) {
      return {
        success: false,
        error: "Transaction not found.",
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

export const getTransactionById = async (id: string) => {
  return withAuth(getTransactionByIdAction, id);
};
