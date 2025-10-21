"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse } from "@/schemas";
import { Database } from "@/schemas/database.types";

interface Service {
  created_at: string;
  id: string;
  name: string;
  price: number;
  quote_id: string;
}

const getQuoteServicesAction = async (
  user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
  quoteId: string,
): Promise<ActionsResponse<Service[]>> => {
  try {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: true });

    if (error) {
      return {
        success: false,
        error: error.message || "Could not fetch services. Please try again.",
      };
    }
    if (!data || data.length === 0) {
      return {
        success: false,
        error: "No services found for this quote.",
      };
    }
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    return {
      success: false,
      error: (error as Error).message || "An unexpected error occurred.",
    };
  }
};

export const getQuoteServices = async (quoteId: string) => {
  return withAuth(getQuoteServicesAction, quoteId);
};
