"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse } from "@/schemas";
import { Database } from "@/schemas/database.types";

interface Category {
  created_at: string | null;
  description: string | null;
  id: string;
  name: string;
}

const getCategoryByIdAction = async (
  user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
  { id }: { id: string },
): Promise<ActionsResponse<Category | null>> => {
  try {
    const { data, error } = await supabase
      .from("transaction_categories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error:
        (error instanceof Error
          ? error.message
          : "An unexpected error occurred.") ||
        "Could not fetch category. Please try again.",
    };
  }
};

export async function getCategoryById(id: string) {
  return withAuth(getCategoryByIdAction, { id });
}
