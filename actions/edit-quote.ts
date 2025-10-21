"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse } from "@/schemas";

// Interfaces para os dados
interface QuoteData {
  client_name?: string;
  client_phone?: string;
  client_cpf?: string;
  client_address?: string;
  vehicle_model?: string;
  vehicle_brand?: string;
  vehicle_license_plate?: string;
  observations?: string;
  vehicle_year?: string;
  vehicle_color?: string;
  vehicle_chassi?: string;
  total_price?: number;
}

interface ServiceData {
  id?: string; // Opcional para novos serviços
  name: string;
  price: number; // Usar número para o banco
  quote_id: string;
}

async function editQuoteAction(
  user: { id: string; email?: string },
  supabase: SupabaseClient,
  quoteId: string,
  quoteData: QuoteData,
  services: ServiceData[],
  servicesToDelete: string[],
): Promise<ActionsResponse<[]>> {
  // Calcular o total_price baseado nos serviços
  const totalPrice = services.reduce((acc, service) => acc + service.price, 0);
  console.log(quoteData);

  // Adicionar o total_price aos dados do orçamento
  const quoteDataWithTotal = {
    ...quoteData,
    total_price: totalPrice,
  };

  const { error } = await supabase.rpc("handle_edit_quote", {
    quote_id_input: quoteId,
    quote_data_input: quoteDataWithTotal,
    services_to_upsert_input: services,
    services_to_delete_input: servicesToDelete,
  });

  if (error) {
    console.error("RPC Error:", error);

    return {
      success: false,
      error: error.message || "Ocorreu um erro ao salvar o orçamento.",
    };
  }

  return {
    success: true,
    data: [],
  };
}

export const editQuote = async (
  quoteId: string,
  quoteData: QuoteData,
  services: ServiceData[],
  servicesToDelete: string[],
) => {
  return withAuth(
    editQuoteAction,
    quoteId,
    quoteData,
    services,
    servicesToDelete,
  );
};
