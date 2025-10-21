"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse } from "@/schemas";
import { Database } from "@/schemas/database.types";

const isManagerAction = async (
  user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
): Promise<ActionsResponse<null>> => {
  const { data: employee, error } = await supabase
    .from("employees")
    .select("roles(name)")
    .eq("id", user.id)
    .single();

  if (error || !employee || employee.roles?.name !== "Gerente") {
    return {
      success: false,
      error: "Usuário não é gerente",
    };
  }

  return {
    success: true,
    data: null,
  };
};

export async function isManager() {
  return withAuth(isManagerAction);
}
