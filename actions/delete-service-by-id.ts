"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse } from "@/schemas";
import { Database } from "@/schemas/database.types";

type DeleteServiceByIdData =
  | {
      created_at: string;
      id: string;
      name: string;
      price: number;
      quote_id: string;
    }[]
  | null;

const deleteServiceByIdAction = async (
  user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
  ids: string[],
): Promise<ActionsResponse<DeleteServiceByIdData>> => {
  const { data, error } = await supabase
    .from("services")
    .delete()
    .in("id", ids)
    .select();

  if (error) {
    return {
      success: false,
      error: error.message || "Could not delete services. Please try again.",
    };
  }
  if (!data || data.length === 0) {
    return {
      success: false,
      error: "No services found to delete.",
    };
  }
  return {
    success: true,
    data,
  };
};

export async function deleteServiceById(ids: string[]) {
  return withAuth(deleteServiceByIdAction, ids);
}
