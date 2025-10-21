"use server";

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { env } from "@/env";
import { withAuth } from "@/lib/with-auth";
import { ActionsResponse } from "@/schemas";
import { Database } from "@/schemas/database.types";

// Schema de validação
const changePasswordSchema = z.object({
  employeeId: z.string().uuid("ID do funcionário inválido"),
  newPassword: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type ChangePasswordData = z.infer<typeof changePasswordSchema>;

async function changeEmployeePasswordAction(
  user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
  data: ChangePasswordData,
): Promise<ActionsResponse<null>> {
  try {
    // 1. Verificar se o usuário atual é gerente
    const { data: currentUserRole } = await supabase.rpc("get_my_role");

    if (currentUserRole !== "Gerente") {
      return {
        success: false,
        error: "Apenas gerentes podem alterar senhas de funcionários.",
      };
    }

    // 2. Validação dos dados
    const validatedData = changePasswordSchema.parse(data);
    const { employeeId, newPassword } = validatedData;

    // 3. Criar cliente Admin do Supabase
    const supabaseAdmin = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY, // Service Role Key é necessária para admin
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // 4. Verificar se o funcionário existe
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from("employees")
      .select("id, full_name")
      .eq("id", employeeId)
      .single();
    console.log("Employee fetch result:", { employee, employeeError });

    if (employeeError || !employee) {
      return {
        success: false,
        error: "Funcionário não encontrado",
      };
    }

    // 5. Atualizar a senha do usuário usando o Admin API
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(employee?.id, {
        password: newPassword,
      });

    if (updateError) {
      console.error("Erro ao atualizar senha:", updateError);
      return {
        success: false,
        error: updateError.message || "Erro ao atualizar a senha",
      };
    }

    // 6. Revalidar as páginas relevantes
    revalidatePath("/employees");

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    console.error("Erro na action de alteração de senha:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Dados inválidos",
      };
    }

    return {
      success: false,
      error: "Erro interno do servidor",
    };
  }
}

// Exportar com proteção de autenticação
export async function changeEmployeePassword(data: ChangePasswordData) {
  return withAuth(changeEmployeePasswordAction, data);
}
