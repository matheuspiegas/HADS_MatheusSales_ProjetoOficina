"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse, Quote } from "@/schemas";
import { Database } from "@/schemas/database.types";

export interface ListQuotesResponse {
  quotes: Quote[];
  totalPages: number;
}

const listQuotesAction = async (
  user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
  args: { page?: number },
): Promise<ActionsResponse<ListQuotesResponse>> => {
  try {
    const page = args.page || 1;
    const pageSize = 10;
    const {
      data: quotes,
      error,
      count,
    } = await supabase
      .from("quotes")
      .select("*", { count: "exact" })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) {
      return {
        success: false,
        error: error.message || "Could not fetch quotes. Please try again.",
      };
    }

    const totalPages = count ? Math.ceil(count / pageSize) : 1;

    if (!quotes || quotes.length === 0) {
      return {
        success: true,
        data: {
          quotes: [],
          totalPages: 0,
        },
      };
    }
    return {
      success: true,
      data: {
        quotes,
        totalPages,
      },
    };
  } catch (error: any) {
    console.log("Error: ", error);
    return {
      success: false,
      error: (error as Error).message || "An unexpected error occurred.",
    };
  }
};

export const listQuotes = async (args: {
  page?: number;
}): Promise<ActionsResponse<ListQuotesResponse>> => {
  return withAuth(listQuotesAction, args);
};
