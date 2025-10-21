"use server";

import { createClient } from "@/utils/supabase/server";

export const setUsersName = async (formData: FormData) => {
  const name = formData.get("name");
  const supabase = await createClient();
  const user = await supabase.auth.getUser();
  if (!user.data.user) {
    throw new Error("User not found");
  }
  const { data, error } = await supabase.auth.updateUser({
    data: {
      name,
    },
  });
};
