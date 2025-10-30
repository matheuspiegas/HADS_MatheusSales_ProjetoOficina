"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse, Vehicle } from "@/schemas";
import { Database } from "@/schemas/database.types";

type VehicleWithClient = Vehicle & {
  clients: {
    id: string;
    name: string;
  } | null;
};

type ListVehiclesFilters = {
  page?: number;
  limit?: number;
  model?: string | null;
  licensePlate?: string | null;
  clientId?: string | null;
};

type ListVehiclesResponse = {
  vehicles: VehicleWithClient[];
  totalPages: number;
};

const listVehiclesAction = async (
  _user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
  filters: ListVehiclesFilters = {},
): Promise<ActionsResponse<ListVehiclesResponse>> => {
  try {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 10;
    const start = (page - 1) * limit;
    const end = page * limit - 1;
    const model = filters.model?.trim();
    const licensePlate = filters.licensePlate?.trim();

    let query = supabase
      .from("vehicles")
      .select("*, clients:clients(id, name)", { count: "exact" })
      .order("created_at", { ascending: false });

    if (model) {
      query = query.ilike("model", `%${model}%`);
    }

    if (licensePlate) {
      query = query.ilike("license_plate", `%${licensePlate}%`);
    }

    if (filters.clientId) {
      query = query.eq("client_id", filters.clientId);
    }

    const { data, count, error } = await query.range(start, end);

    if (error) {
      return {
        success: false,
        error: error.message || "Erro ao buscar veículos.",
      };
    }

    return {
      success: true,
      data: {
        vehicles: (data as VehicleWithClient[]) || [],
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message || "Ocorreu um erro inesperado.",
    };
  }
};

export const listVehicles = async (filters: ListVehiclesFilters = {}) => {
  return withAuth(listVehiclesAction, filters);
};
