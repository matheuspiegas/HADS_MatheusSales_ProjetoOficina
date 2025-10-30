"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { normalizeText } from "@/lib/normalization";
import { withAuth } from "@/lib/with-auth";
import { ActionsResponse, Client } from "@/schemas";
import { Database } from "@/schemas/database.types";

type ListClientsFilters = {
  page?: number;
  limit?: number;
  search?: string | null;
};

type ListClientsResponse = {
  clients: Client[];
  totalPages: number;
};

const listClientsAction = async (
  _user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
  filters: ListClientsFilters = {},
): Promise<ActionsResponse<ListClientsResponse>> => {
  try {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 10;
    const start = (page - 1) * limit;
    const end = page * limit - 1;
    const search = filters.search?.trim();

    let query = supabase
      .from("clients")
      .select("*", { count: "exact" })
      .order("name", { ascending: true });

    if (search) {
      // Utiliza a coluna normalizada para a busca
      query = query.ilike("name_normalized", `%${normalizeText(search)}%`);
    }

    const { data, count, error } = await query.range(start, end);

    if (error) {
      return {
        success: false,
        error: error.message || "Erro ao buscar clientes.",
      };
    }

    const totalPages = count ? Math.ceil(count / limit) : 0;

    return {
      success: true,
      data: {
        clients: data || [],
        totalPages,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message || "Ocorreu um erro inesperado.",
    };
  }
};

export const listClients = async (filters: ListClientsFilters = {}) => {
  return withAuth(listClientsAction, filters);
};
