"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { supabase } from "@/lib/supabase-client";
import { ActionsResponse } from "@/schemas";

const resetPasswordSchema = z.string().email({ message: "Invalid email" });

export const resetPassword = async (
  email: string,
): Promise<ActionsResponse<null>> => {
  try {
    const { success } = resetPasswordSchema.safeParse(email);
    if (!success) {
      return {
        success: false,
        error: "Invalid email",
      };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }
    revalidatePath("/signin");
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
