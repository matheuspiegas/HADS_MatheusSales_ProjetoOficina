"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse } from "@/schemas";
import { Database } from "@/schemas/database.types";

const deleteCategoryAction = async (
  user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<ActionsResponse<null>> => {
  try {
    // Regra de Negócio: Verificar se a categoria está sendo utilizada em alguma transação
    const { data: transactionsWithCategory, error: checkError } = await supabase
      .from("transactions")
      .select("id")
      .eq("transaction_category_id", id)
      .limit(1);

    if (checkError) {
      return {
        success: false,
        error: "Erro ao verificar transações associadas à categoria.",
      };
    }

    // Se existirem transações associadas, BLOQUEAR a exclusão
    if (transactionsWithCategory && transactionsWithCategory.length > 0) {
      return {
        success: false,
        error:
          "Esta categoria não pode ser excluída, pois está associada a transações existentes.",
      };
    }

    // Se não há transações associadas, permitir a exclusão
    const { error } = await supabase
      .from("transaction_categories")
      .delete()
      .eq("id", id);

    if (error) {
      return {
        success: false,
        error:
          error.message ||
          "Não foi possível excluir a categoria. Tente novamente.",
      };
    }

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    return {
      success: false,
      error: "Ocorreu um erro inesperado. Tente novamente.",
    };
  }
};

export const deleteCategory = async (id: string) => {
  return withAuth(deleteCategoryAction, id);
};
