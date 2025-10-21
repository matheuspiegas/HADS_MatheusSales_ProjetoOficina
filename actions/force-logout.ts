"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export async function forceLogout() {
  const supabase = await createClient();

  // Fazer logout no Supabase
  await supabase.auth.signOut();

  // Limpar todos os cookies relacionados à sessão
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  // Remover cookies do Supabase
  allCookies.forEach((cookie) => {
    if (
      cookie.name.startsWith("sb-") ||
      cookie.name.includes("supabase") ||
      cookie.name.includes("auth-token")
    ) {
      cookieStore.delete(cookie.name);
    }
  });

  // Redirecionar para a página de login
  return redirect("/signin");
}
