"use server";

import { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse, updatePasswordSchema } from "@/schemas";
import { Database } from "@/schemas/database.types";

const updatePasswordAction = async (
  user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
  payload: z.infer<typeof updatePasswordSchema>,
): Promise<ActionsResponse<null>> => {
  try {
    const { success } = updatePasswordSchema.safeParse(payload);
    if (!success) {
      return {
        success: false,
        error: "Invalid payload",
      };
    }

    const { error, data } = await supabase.auth.updateUser({
      password: payload.password,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }
    const { user } = data;

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

export async function updatePassword(
  payload: z.infer<typeof updatePasswordSchema>,
) {
  return withAuth(updatePasswordAction, payload);
}
