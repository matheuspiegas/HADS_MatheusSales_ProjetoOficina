"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse, Client, ClientForm } from "@/schemas";
import { Database } from "@/schemas/database.types";

const createClientAction = async (
  _user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
  data: ClientForm,
): Promise<ActionsResponse<Client>> => {
  try {
    const payload = {
      name: data.name.trim(),
      phone: data.phone ?? null,
      cpf: data.cpf ?? null,
      address: data.address ?? null,
    };

    const { data: client, error } = await supabase
      .from("clients")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message || "Não foi possível criar o cliente.",
      };
    }

    if (!client) {
      return {
        success: false,
        error: "Cliente não retornado após a criação.",
      };
    }

    return {
      success: true,
      data: client,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message || "Ocorreu um erro inesperado.",
    };
  }
};

export const createClient = async (data: ClientForm) => {
  return withAuth(createClientAction, data);
};
