"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse } from "@/schemas";
import { Database } from "@/schemas/database.types";

interface Role {
  description: string | null;
  id: string;
  name: string;
}

const getRolesAction = async (
  user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
): Promise<ActionsResponse<Role[]>> => {
  try {
    const { error, data } = await supabase.from("roles").select("*");

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }
    // console.log({ data });
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
        "Could not edit category. Please try again.",
    };
  }
};

export async function getRoles() {
  return withAuth(getRolesAction);
}
