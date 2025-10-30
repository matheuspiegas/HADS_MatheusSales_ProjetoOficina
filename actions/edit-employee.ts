"use server";

import { SupabaseClient } from "@supabase/supabase-js";

import { normalizeText } from "@/lib/normalization";
import { withAuth } from "@/lib/with-auth";
import { ActionsResponse } from "@/schemas";
import { Database } from "@/schemas/database.types";

interface EditEmployeeData {
  id: string;
  full_name: string;
  email: string;
  username: string;
  role_id: string;
  status?: string; // Opcional - só gerentes podem alterar status de outros
}

const editEmployeeAction = async (
  user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
  employeeData: EditEmployeeData,
): Promise<ActionsResponse<null>> => {
  try {
    // 1. Verificar se o usuário atual é gerente
    const { data: currentUserRole } = await supabase.rpc("get_my_role");

    if (currentUserRole !== "Gerente") {
      return {
        success: false,
        error: "Apenas gerentes podem editar funcionários.",
      };
    }

    // 2. Buscar informações do funcionário sendo editado
    const { data: targetEmployee, error: fetchError } = await supabase
      .from("employees")
      .select(
        `
        id,
        full_name,
        email,
        username,
        status,
        role_id,
        roles (
          name
        )
      `,
      )
      .eq("id", employeeData.id)
      .single();

    if (fetchError || !targetEmployee) {
      return {
        success: false,
        error: "Funcionário não encontrado.",
      };
    }

    // 3. Regra de Negócio: Gerente não pode desativar a si mesmo
    const isEditingSelf = user.id === employeeData.id;
    const isChangingStatus =
      employeeData.status && employeeData.status !== targetEmployee.status;

    if (isEditingSelf && isChangingStatus) {
      return {
        success: false,
        error: "Você não pode alterar seu próprio status.",
      };
    }

    // 4. Verificar se o email já existe em outro funcionário
    if (employeeData.email !== targetEmployee.email) {
      const { data: existingEmployee, error: emailCheckError } = await supabase
        .from("employees")
        .select("id")
        .eq("email", employeeData.email)
        .neq("id", employeeData.id)
        .limit(1);

      if (emailCheckError) {
        return {
          success: false,
          error: "Erro ao verificar email duplicado.",
        };
      }

      if (existingEmployee && existingEmployee.length > 0) {
        return {
          success: false,
          error: "Já existe um funcionário com este email.",
        };
      }
    }

    // 5. Verificar se o username já existe em outro funcionário
    if (employeeData.username !== targetEmployee.username) {
      const { data: existingUsername, error: usernameCheckError } = await supabase
        .from("employees")
        .select("id")
        .eq("username_normalized", normalizeText(employeeData.username))
        .neq("id", employeeData.id)
        .limit(1);

      if (usernameCheckError) {
        return {
          success: false,
          error: "Erro ao verificar username duplicado.",
        };
      }

      if (existingUsername && existingUsername.length > 0) {
        return {
          success: false,
          error: "Já existe um funcionário com este username.",
        };
      }
    }

    // 6. Preparar dados para atualização
    const updateData: Database["public"]["Tables"]["employees"]["Update"] = {
      full_name: employeeData.full_name,
      email: employeeData.email,
      username: employeeData.username,
      role_id: employeeData.role_id,
    };

    // Só incluir status se não for self-edit
    if (!isEditingSelf && employeeData?.status) {
      updateData.status = employeeData.status;
    }

    // 7. Atualizar funcionário
    const { error: updateError } = await supabase
      .from("employees")
      .update(updateData)
      .eq("id", employeeData.id);

    if (updateError) {
      // Tratar erros específicos do PostgreSQL
      if (updateError.message.includes("duplicate key value violates")) {
        if (updateError.message.includes("email")) {
          return {
            success: false,
            error: "Já existe um funcionário com este email.",
          };
        }
        if (updateError.message.includes("username")) {
          return {
            success: false,
            error: "Já existe um funcionário com este username.",
          };
        }
      }

      return {
        success: false,
        error:
          updateError.message ||
          "Não foi possível atualizar o funcionário. Tente novamente.",
      };
    }

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("Erro ao editar funcionário:", error);
    return {
      success: false,
      error: "Ocorreu um erro inesperado. Tente novamente.",
    };
  }
};

export const editEmployee = async (employeeData: EditEmployeeData) => {
  return withAuth(editEmployeeAction, employeeData);
};
