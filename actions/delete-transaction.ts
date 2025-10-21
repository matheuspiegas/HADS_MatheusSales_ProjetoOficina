"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse } from "@/schemas";
import { Database } from "@/schemas/database.types";

const deleteTransactionAction = async (
  user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<ActionsResponse<null>> => {
  try {
    const { error } = await supabase.from("transactions").delete().eq("id", id);

    if (error) {
      return {
        success: false,
        error:
          error.message || "Could not delete transaction. Please try again.",
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

export const deleteTransaction = async (id: string) => {
  return withAuth(deleteTransactionAction, id);
};
