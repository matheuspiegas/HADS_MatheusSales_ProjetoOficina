"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse, Client } from "@/schemas";
import { Database } from "@/schemas/database.types";

type ClientOption = Pick<Client, "id" | "name">;

const getClientsOptionsAction = async (
  _user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
): Promise<ActionsResponse<ClientOption[]>> => {
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      return {
        success: false,
        error: error.message || "Erro ao carregar clientes.",
      };
    }

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message || "Ocorreu um erro inesperado.",
    };
  }
};

export const getClientsOptions = async () => {
  return withAuth(getClientsOptionsAction);
};
