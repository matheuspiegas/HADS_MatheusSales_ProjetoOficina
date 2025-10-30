"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse, Vehicle, VehicleForm } from "@/schemas";
import { Database } from "@/schemas/database.types";

const createVehicleAction = async (
  _user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
  data: VehicleForm,
): Promise<ActionsResponse<Vehicle>> => {
  try {
    const payload = {
      client_id: data.clientId,
      brand: data.brand ?? null,
      model: data.model.trim(),
      license_plate: data.licensePlate
        ? data.licensePlate.trim().toUpperCase()
        : null,
      year: data.year ?? null,
      color: data.color ?? null,
      chassis: data.chassis ?? null,
    };

    const { data: vehicle, error } = await supabase
      .from("vehicles")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message || "Não foi possível criar o veículo.",
      };
    }

    if (!vehicle) {
      return {
        success: false,
        error: "Veículo não retornado após a criação.",
      };
    }

    return {
      success: true,
      data: vehicle,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message || "Ocorreu um erro inesperado.",
    };
  }
};

export const createVehicle = async (data: VehicleForm) => {
  return withAuth(createVehicleAction, data);
};
