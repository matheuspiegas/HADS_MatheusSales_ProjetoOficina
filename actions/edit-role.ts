"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse } from "@/schemas";
import { Database } from "@/schemas/database.types";

interface EditRoleData {
  id: string;
  name: string;
  description: string | null;
}

const editRoleAction = async (
  user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
  roleData: EditRoleData,
): Promise<ActionsResponse<null>> => {
  try {
    // 1. Verificar se o usuário atual é gerente
    const { data: currentUserRole } = await supabase.rpc("get_my_role");

    if (currentUserRole !== "Gerente") {
      return {
        success: false,
        error: "Apenas gerentes podem editar cargos.",
      };
    }

    // 2. Verificar se o cargo existe
    const { data: existingRole, error: fetchError } = await supabase
      .from("roles")
      .select("id, name")
      .eq("id", roleData.id)
      .single();

    if (fetchError || !existingRole) {
      return {
        success: false,
        error: "Cargo não encontrado.",
      };
    }

    // 3. Bloquear edição do cargo "Gerente" para proteger a lógica do sistema
    if (existingRole.name === "Gerente") {
      return {
        success: false,
        error:
          "O cargo 'Gerente' não pode ser editado para manter a integridade do sistema.",
      };
    }

    // 4. Verificar se já existe outro cargo com o mesmo nome
    if (roleData.name !== existingRole.name) {
      const { data: duplicateRole, error: duplicateError } = await supabase
        .from("roles")
        .select("id")
        .eq("name", roleData.name)
        .neq("id", roleData.id)
        .limit(1);

      if (duplicateError) {
        return {
          success: false,
          error: "Erro ao verificar nome duplicado.",
        };
      }

      if (duplicateRole && duplicateRole.length > 0) {
        return {
          success: false,
          error: "Já existe um cargo com este nome.",
        };
      }
    }

    // 5. Atualizar o cargo
    const { error: updateError } = await supabase
      .from("roles")
      .update({
        name: roleData.name,
        description: roleData.description,
      })
      .eq("id", roleData.id);

    if (updateError) {
      return {
        success: false,
        error: updateError.message || "Não foi possível atualizar o cargo.",
      };
    }

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("Erro ao editar cargo:", error);
    return {
      success: false,
      error: "Ocorreu um erro inesperado. Tente novamente.",
    };
  }
};

export const editRole = async (roleData: EditRoleData) => {
  return withAuth(editRoleAction, roleData);
};
