"use server";

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { env } from "@/env";
import { withAuth } from "@/lib/with-auth";
import { ActionsResponse } from "@/schemas";
import { Database } from "@/schemas/database.types";

const userSchema = z.object({
  username: z
    .string({ required_error: "Nome de usuário é obrigatório." })
    .min(3, "Nome de usuário deve ter pelo menos 3 caracteres."),
  email: z
    .string({ required_error: "E-mail é obrigatório" })
    .email("E-mail inválido."),
  fullname: z
    .string({ required_error: "Nome completo é obrigatório" })
    .min(3, "Nome completo deve ter pelo menos 3 caracteres."),
  password: z
    .string({ required_error: "Senha é obrigatório" })
    .min(6, "Senha deve ter pelo menos 6 caracteres.")
    .max(100, "Senha deve ter no máximo 100 caracteres."),
  role: z
    .string({ required_error: "Cargo é obrigatório" })
    .min(1, "Cargo é obrigatório.")
    .uuid(),
});

const createUserAction = async (
  user: { id: string; email?: string },
  supabase: SupabaseClient<Database>,
  userData: z.infer<typeof userSchema>,
): Promise<ActionsResponse<null>> => {
  try {
    const { success } = userSchema.safeParse(userData);

    if (!success) {
      return {
        success: false,
        error: "Invalid user data",
      };
    }

    const adminClient = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    // Verificar se já existe funcionário com o mesmo email ou username
    const { data: existingUsers, error: checkError } = await supabase
      .from("employees")
      .select("email, username")
      .or(`email.eq.${userData.email},username.eq.${userData.username}`);
    console.log("Verificação de usuários existentes:", {
      existingUsers,
      checkError,
    });
    if (checkError) {
      console.error("Erro ao verificar dados existentes:", checkError);
      return {
        success: false,
        error: "Erro interno ao validar dados. Tente novamente.",
      };
    }

    if (existingUsers && existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      if (existingUser.email === userData.email) {
        return {
          success: false,
          error: `Já existe um funcionário cadastrado com o email: ${userData.email}`,
        };
      }
      if (existingUser.username === userData.username) {
        return {
          success: false,
          error: `Já existe um funcionário cadastrado com o username: ${userData.username}`,
        };
      }
    }

    const { error } = await adminClient.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        username: userData.username,
        fullname: userData.fullname,
        role: userData.role,
      },
    });

    if (error) {
      console.error("Erro ao criar usuário:", error);

      // Tratamento de erros mais específicos
      let errorMessage = "Erro ao criar usuário.";

      if (error.message?.toLowerCase().includes("duplicate")) {
        errorMessage =
          "Já existe um usuário com esse email ou dados similares.";
      } else if (error.message?.toLowerCase().includes("email")) {
        errorMessage = "Problema com o email fornecido. Verifique se é válido.";
      } else if (error.message?.toLowerCase().includes("password")) {
        errorMessage = "A senha não atende aos critérios de segurança.";
      } else if (error.code === "unexpected_failure") {
        errorMessage =
          "Falha inesperada. Verifique se todos os dados são válidos e únicos.";
      } else {
        errorMessage = `Erro: ${error.message}`;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    return {
      success: false,
      error:
        (error instanceof Error
          ? error.message
          : "An unexpected error occurred.") ||
        "Could not edit category. Please try again.",
    };
  }
};

export async function createUser(userData: z.infer<typeof userSchema>) {
  return withAuth(createUserAction, userData);
}
