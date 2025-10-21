"use server";

import { createClient } from "@/utils/supabase/server";

export const getUser = async () => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !user.id) {
      return {
        success: false,
        message: "Usuário não autenticado",
      };
    }
    return user;
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "Erro ao obter usuário",
    };
  }
};
