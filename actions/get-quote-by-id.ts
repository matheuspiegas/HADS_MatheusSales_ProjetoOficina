"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse } from "@/schemas";
import { Database } from "@/schemas/database.types";

const getQuoteByIdAction = async (
  user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<ActionsResponse<Database["public"]["Tables"]["quotes"]["Row"]>> => {
  try {
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (!data) {
      return {
        success: false,
        error: "Quote not found",
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error: unknown) {
    console.error("Error fetching user:", error);
    return {
      success: false,
      error:
        (error instanceof Error
          ? error.message
          : "An unexpected error occurred.") ||
        "Could not fetch quote. Please try again.",
    };
  }
};

export async function getQuoteById(id: string) {
  return withAuth(getQuoteByIdAction, id);
}
