"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error signing out:", error);
    throw new Error("Failed to sign out");
  }
  return redirect("/signin");
}
