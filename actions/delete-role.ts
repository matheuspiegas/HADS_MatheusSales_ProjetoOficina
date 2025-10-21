"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { withAuth } from "@/lib/with-auth";
import { ActionsResponse } from "@/schemas";
import { Database } from "@/schemas/database.types";

const deleteRoleAction = async (
  user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
  roleId: string,
): Promise<ActionsResponse<null>> => {
  try {
    // 1. Verificar se o usuário atual é gerente
    const { data: currentUserRole } = await supabase.rpc("get_my_role");

    if (currentUserRole !== "Gerente") {
      return {
        success: false,
        error: "Apenas gerentes podem excluir cargos.",
      };
    }

    // 2. Verificar se o cargo existe
    const { data: role, error: roleError } = await supabase
      .from("roles")
      .select("id, name")
      .eq("id", roleId)
      .single();

    if (roleError || !role) {
      return {
        success: false,
        error: "Cargo não encontrado.",
      };
    }

    // 3. Bloquear exclusão do cargo "Gerente" para proteger a lógica do sistema
    if (role.name === "Gerente") {
      return {
        success: false,
        error:
          "O cargo 'Gerente' não pode ser excluído, pois é reservado pelo sistema.",
      };
    }

    // 4. Verificar se o cargo está sendo usado por algum funcionário
    const { data: employeesUsingRole, error: employeesError } = await supabase
      .from("employees")
      .select("id, full_name")
      .eq("role_id", roleId)
      .limit(1);

    if (employeesError) {
      console.error("Erro ao verificar funcionários:", employeesError);
      return {
        success: false,
        error: "Erro interno ao verificar dependências do cargo.",
      };
    }

    if (employeesUsingRole && employeesUsingRole.length > 0) {
      return {
        success: false,
        error: `Este cargo não pode ser excluído, pois está sendo usado por funcionários. Primeiro reatribua os funcionários para outro cargo.`,
      };
    }

    // 5. Excluir o cargo
    const { error: deleteError } = await supabase
      .from("roles")
      .delete()
      .eq("id", roleId);

    if (deleteError) {
      console.error("Erro ao excluir cargo:", deleteError);
      return {
        success: false,
        error: deleteError.message || "Não foi possível excluir o cargo.",
      };
    }

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("Erro ao excluir cargo:", error);
    return {
      success: false,
      error: "Ocorreu um erro inesperado. Tente novamente.",
    };
  }
};

export const deleteRole = async (roleId: string) => {
  return withAuth(deleteRoleAction, roleId);
};
