"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse, EmployeeWithRole } from "@/schemas";
import { Database } from "@/schemas/database.types";

interface ListEmployeesFilters {
  page?: number;
  limit?: number;
  status?: "Ativo" | "Inativo";
  role_id?: string;
  search?: string | null;
}

const listEmployeesAction = async (
  user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
  filters: ListEmployeesFilters = {},
): Promise<
  ActionsResponse<{ employees: EmployeeWithRole[]; totalPages: number }>
> => {
  try {
    // 1. Verificar se o usuário atual é gerente
    const { data: currentUserRole } = await supabase.rpc("get_my_role");

    if (currentUserRole !== "Gerente") {
      return {
        success: false,
        error: "Apenas gerentes podem visualizar a lista de funcionários.",
      };
    }

    const { page = 1, limit = 10, status, role_id, search } = filters;
    const start = (page - 1) * limit;
    const end = page * limit - 1;
    console.log({ filters });

    // 2. Query base para buscar funcionários com roles
    let query = supabase
      .from("employees")
      .select(
        `
        id,
        full_name,
        email,
        username,
        status,
        is_first_login,
        roles (
          id,
          name
        )
      `,
      )
      .order("full_name", { ascending: true });

    // 3. Aplicar filtros opcionais
    if (status) {
      query = query.eq("status", status);
    }

    if (search) {
      console.log("pesquisa sendo realizada para:", search);
      query = query.ilike("full_name", `%${search}%`);
    }

    if (role_id) {
      query = query.eq("role_id", role_id);
    }

    // 4. Aplicar paginação
    const { data: employees, error: employeesError } = await query.range(
      start,
      end,
    );

    if (employeesError) {
      console.error("Erro ao buscar funcionários:", employeesError);
      return {
        success: false,
        error: "Erro ao buscar funcionários. Tente novamente.",
      };
    }

    // 5. Contar total de registros para paginação
    let countQuery = supabase
      .from("employees")
      .select("*", { count: "exact", head: true });

    // Aplicar os mesmos filtros na contagem
    if (status) {
      countQuery = countQuery.eq("status", status);
    }

    if (role_id) {
      countQuery = countQuery.eq("role_id", role_id);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error("Erro ao contar funcionários:", countError);
      return {
        success: false,
        error: "Erro ao calcular paginação.",
      };
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return {
      success: true,
      data: {
        employees: employees as EmployeeWithRole[],
        totalPages,
      },
    };
  } catch (error) {
    console.error("Erro inesperado ao listar funcionários:", error);
    return {
      success: false,
      error: "Ocorreu um erro inesperado. Tente novamente.",
    };
  }
};

export const listEmployees = async (filters: ListEmployeesFilters = {}) => {
  return withAuth(listEmployeesAction, filters);
};
