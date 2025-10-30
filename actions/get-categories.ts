"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { normalizeText } from "@/lib/normalization";
import { withAuth } from "@/lib/with-auth";
import { ActionsResponse, Category } from "@/schemas";
import { Database } from "@/schemas/database.types";

const getCategoriesAction = async (
  user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
  args?: { page?: number; search?: string; perPage?: number },
): Promise<
  ActionsResponse<{ categories: Category[]; totalPages: number } | null>
> => {
  try {
    const page = args?.page || 1;
    const perPage = args?.perPage || 10;
    const start = (page - 1) * perPage;
    const end = page * perPage - 1;

    let query = supabase
      .from("transaction_categories")
      .select("*, name_normalized", { count: "exact" });

    if (args?.search) {
      // Busca na coluna normalizada para ser case/accent-insensitive
      query = query.ilike("name_normalized", `%${normalizeText(args.search)}%`);
    }

    // Aplicar paginação
    query = query.range(start, end).order("name", { ascending: true });

    // Executar a consulta
    const { data, error, count } = await query;

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    const totalPages = count ? Math.ceil(count / perPage) : 0;

    if (data.length === 0 || !data) {
      return {
        success: true,
        data: { categories: [], totalPages: 0 },
      };
    }

    return {
      success: true,
      data: { categories: data, totalPages },
    };
  } catch (error) {
    return {
      success: false,
      error:
        (error instanceof Error
          ? error.message
          : "An unexpected error occurred.") ||
        "Could not fetch categories. Please try again.",
    };
  }
};

export async function getCategories(args?: {
  page?: number;
  search?: string;
  perPage?: number;
}) {
  return withAuth(getCategoriesAction, args);
}
