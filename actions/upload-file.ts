"use server";
import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";

type FileUploadState = {
  success: boolean;
  message: string;
};

export const uploadFile = async (
  prevState: FileUploadState,
  formData: FormData,
) => {
  const file = formData.get("file") as File;
  if (file.size === 0) {
    return {
      success: false,
      message: "File is empty",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !user.id) {
      return {
        success: false,
        message: "User not found",
      };
    }
    const fileSavedInBucket = await supabase.storage
      .from("files")
      .upload(`${user.id}/${file.name}`, file);
    if (fileSavedInBucket.error) {
      console.error("Error uploading file:", fileSavedInBucket.error);
      return {
        success: false,
        message: "Error uploading file",
      };
    }
    const {
      data: { fullPath, path },
    } = fileSavedInBucket;

    const fileInTable = await supabase.from("files").insert({
      name: file.name,
      type: file.type,
      owner: user.id,
      size: file.size,
      full_path: fullPath,
      path,
    });
    if (fileInTable.error) {
      console.error("Error inserting file into table:", fileInTable.error);
      return {
        success: false,
        message: "Error inserting file into table",
      };
    }
    revalidatePath("/");
    return {
      success: true,
      message: "File uploaded successfully",
    };
  } catch (error: any) {
    console.error("Error: ", error);
    return {
      success: false,
      message: "Error uploading file",
    };
  }
};
