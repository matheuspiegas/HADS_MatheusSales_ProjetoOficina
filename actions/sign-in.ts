"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "../utils/supabase/server";

export const signIn = async (email: string, password: string) => {
  const supabase = await createClient();

  // 1. Authenticate the user first
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError) {
    return {
      success: false,
      message: authError.code,
    };
  }

  if (!authData.user) {
    return {
      success: false,
      message: "User not found after sign-in.",
    };
  }

  // 2. After successful login, check the employee details
  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("is_first_login")
    .eq("id", authData.user.id)
    .single();

  // This error can happen if a user exists in auth but not in employees, or if RLS blocks it.
  if (employeeError) {
    return {
      success: false,
      message: `Could not retrieve employee details: ${employeeError.message}`,
    };
  }

  // 3. Redirect based on the flag
  if (employee?.is_first_login) {
    return redirect("/account/update-password");
  }

  revalidatePath("/", "layout");
  redirect("/");
};
