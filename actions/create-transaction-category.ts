"use server";

import { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse } from "@/schemas";
import { Database } from "@/schemas/database.types";

type TransactionCategoryData = {
  name: string;
  description?: string;
};

const createTransactionCategoryAction = async (
  user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
  data: TransactionCategoryData,
): Promise<ActionsResponse<null>> => {
  try {
    const { error } = await supabase.from("transaction_categories").insert({
      name: data.name,
      description: data.description,
    });

    if (error) {
      return {
        success: false,
        error:
          error.message ||
          "Could not create transaction category. Please try again.",
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

export const createTransactionCategory = async (
  data: TransactionCategoryData,
): Promise<ActionsResponse<null>> => {
  return withAuth(createTransactionCategoryAction, data);
};
