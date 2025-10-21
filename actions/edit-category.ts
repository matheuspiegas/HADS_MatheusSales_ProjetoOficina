"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse } from "@/schemas";
import { Database } from "@/schemas/database.types";

interface EditCategoryPayload {
  id: string;
  name: string;
  description?: string | null;
}

const editCategoryAction = async (
  user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
  payload: EditCategoryPayload,
): Promise<ActionsResponse<null>> => {
  try {
    const { error } = await supabase
      .from("transaction_categories")
      .update({
        name: payload.name,
        description: payload.description,
      })
      .eq("id", payload.id);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    return {
      success: false,
      error:
        (error instanceof Error
          ? error.message
          : "An unexpected error occurred.") ||
        "Could not edit category. Please try again.",
    };
  }
};

export async function editCategory(payload: EditCategoryPayload) {
  return withAuth(editCategoryAction, payload);
}
