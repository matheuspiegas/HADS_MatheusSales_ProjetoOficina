"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse, Vehicle, VehicleForm } from "@/schemas";
import { Database } from "@/schemas/database.types";

type UpdateVehiclePayload = {
  id: string;
  data: VehicleForm;
};

const updateVehicleAction = async (
  _user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
  payload: UpdateVehiclePayload,
): Promise<ActionsResponse<Vehicle>> => {
  try {
    const { id, data } = payload;

    const updates = {
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
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message || "Não foi possível atualizar o veículo.",
      };
    }

    if (!vehicle) {
      return {
        success: false,
        error: "Veículo não encontrado.",
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

export const updateVehicle = async (payload: UpdateVehiclePayload) => {
  return withAuth(updateVehicleAction, payload);
};
