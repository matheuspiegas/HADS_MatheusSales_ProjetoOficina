"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { ActionsResponse } from "@/schemas";
import { createClient } from "@/utils/supabase/server";

type AuthenticatedAction<T extends any[], R> = (
  user: { id: string; email?: string },
  supabase: SupabaseClient,
  ...args: T
) => Promise<ActionsResponse<R>>;

export async function withAuth<T extends any[], R>(
  action: AuthenticatedAction<T, R>,
  ...args: T
): Promise<ActionsResponse<R>> {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.id) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Chama a ação original passando o usuário como primeiro parâmetro
    return await action(user, supabase, ...args);
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message || "An unexpected error occurred.",
    };
  }
}
