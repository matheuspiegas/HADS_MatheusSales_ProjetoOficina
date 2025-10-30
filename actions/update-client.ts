"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse, Client, ClientForm } from "@/schemas";
import { Database } from "@/schemas/database.types";

type UpdateClientPayload = {
  id: string;
  data: ClientForm;
};

const updateClientAction = async (
  _user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
  payload: UpdateClientPayload,
): Promise<ActionsResponse<Client>> => {
  try {
    const { id, data } = payload;

    const updates = {
      name: data.name.trim(),
      phone: data.phone ?? null,
      cpf: data.cpf ?? null,
      address: data.address ?? null,
    };

    const { data: client, error } = await supabase
      .from("clients")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message || "Não foi possível atualizar o cliente.",
      };
    }

    if (!client) {
      return {
        success: false,
        error: "Cliente não encontrado.",
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

export const updateClient = async (payload: UpdateClientPayload) => {
  return withAuth(updateClientAction, payload);
};
