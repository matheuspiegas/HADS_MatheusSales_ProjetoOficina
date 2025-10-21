"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse } from "@/schemas";
import { Database } from "@/schemas/database.types";

interface CreateRoleData {
  name: string;
  description: string | null;
}

const createRoleAction = async (
  user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
  roleData: CreateRoleData,
): Promise<ActionsResponse<{ id: string }>> => {
  try {
    // 1. Verificar se o usuário atual é gerente
    const { data: currentUserRole } = await supabase.rpc("get_my_role");

    if (currentUserRole !== "Gerente") {
      return {
        success: false,
        error: "Apenas gerentes podem criar cargos.",
      };
    }

    // 2. Bloquear criação de cargo "Gerente" para proteger a lógica do sistema
    if (roleData.name === "Gerente") {
      return {
        success: false,
        error:
          "Não é possível criar outro cargo com o nome 'Gerente'. Este nome é reservado pelo sistema.",
      };
    }

    // 3. Verificar se já existe um cargo com o mesmo nome
    const { data: existingRole, error: duplicateError } = await supabase
      .from("roles")
      .select("id")
      .eq("name", roleData.name)
      .limit(1);

    if (duplicateError) {
      return {
        success: false,
        error: "Erro ao verificar nome duplicado.",
      };
    }

    if (existingRole && existingRole.length > 0) {
      return {
        success: false,
        error: "Já existe um cargo com este nome.",
      };
    }

    // 4. Criar o novo cargo
    const { data: newRole, error: createError } = await supabase
      .from("roles")
      .insert({
        name: roleData.name,
        description: roleData.description,
      })
      .select("id")
      .single();

    if (createError) {
      return {
        success: false,
        error: createError.message || "Não foi possível criar o cargo.",
      };
    }

    return {
      success: true,
      data: { id: newRole.id },
    };
  } catch (error) {
    console.error("Erro ao criar cargo:", error);
    return {
      success: false,
      error: "Ocorreu um erro inesperado. Tente novamente.",
    };
  }
};

export const createRole = async (roleData: CreateRoleData) => {
  return withAuth(createRoleAction, roleData);
};
