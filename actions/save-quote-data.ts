"use server";

import { unformat } from "@react-input/number-format";

import { FormType } from "@/schemas";
import { createClient } from "@/utils/supabase/server";

export const saveQuoteData = async (quoteData: FormType) => {
  const supabase = await createClient();

  try {
    // 1. Get user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not found");
    }
    // 2. Prepare services data (convert price to cents)
    const servicesToCreate = quoteData.servicos.map((service) => ({
      name: service.nome,
      price: Number(unformat(service.preco, "pt-BR")) * 100, // Store price in cents
    }));

    // 3. Calculate total price correctly from the cents value
    const totalPrice = servicesToCreate.reduce(
      (acc, service) => acc + service.price,
      0,
    );

    // 4. Insert the main quote and get its ID
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .insert({
        client_name: quoteData.cliente.nome,
        client_phone: quoteData.cliente.telefone,
        user_id: user.id,
        client_cpf: quoteData.cliente.cpf,
        client_address: quoteData.cliente.endereco,
        vehicle_brand: quoteData.veiculo.marca,
        vehicle_chassi: quoteData.veiculo.chassi,
        vehicle_model: quoteData.veiculo.modelo,
        vehicle_year: quoteData.veiculo.ano,
        vehicle_color: quoteData.veiculo.cor,
        vehicle_license_plate: quoteData.veiculo.placa,
        total_price: totalPrice,
        observations: quoteData.observacoes,
      })
      .select("*")
      .single(); // Use .single() to get a single object, not an array

    if (quoteError || !quote) {
      console.error("Error creating quote:", quoteError);
      throw new Error("Could not save the quote. Please try again.");
    }

    const quoteId = quote.id;

    // 5. Associate the new quote_id with each service
    const servicesWithQuoteId = servicesToCreate.map((service) => ({
      ...service,
      quote_id: quoteId,
    }));

    // 6. Insert all services in a single, safe batch
    const { error: servicesError } = await supabase
      .from("services")
      .insert(servicesWithQuoteId);

    if (servicesError) {
      console.error("Error creating services:", servicesError);
      // Here you might want to delete the quote that was just created for consistency
      await supabase.from("quotes").delete().eq("id", quoteId);
      throw new Error("Could not save the services. Please try again.");
    }

    return { success: true, message: "Quote saved!", data: quote };
  } catch (error: any) {
    console.error("An unexpected error occurred:", error.message);
    return { success: false, message: error.message };
  }
};
