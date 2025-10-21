"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse } from "@/schemas";
import { Database } from "@/schemas/database.types";

const deleteQuoteAction = async (
  user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<ActionsResponse<null>> => {
  try {
    // Usar função RPC para exclusão atômica (transacional)
    const { data, error } = (await supabase.rpc("delete_quote_with_services", {
      quote_id: id,
    })) as { data: { success: boolean; error?: string } | null; error: any };

    if (error) {
      return {
        success: false,
        error: error.message || "Could not delete quote. Please try again.",
      };
    }

    // Verificar se a função RPC retornou sucesso
    if (data && !data.success) {
      return {
        success: false,
        error: data.error || "Could not delete quote. Please try again.",
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

export const deleteQuote = async (id: string) => {
  return withAuth(deleteQuoteAction, id);
};
