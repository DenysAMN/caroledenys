"use server";

import { redirect } from "next/navigation";
import { isAllowedAdminEmail } from "@/lib/admin-policy";
import { createServerClient } from "@/lib/supabase/server";

export type LoginState = { error: string | null };

export async function login(
  _previousState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!isAllowedAdminEmail(email) || password.length < 1) {
    return { error: "E-mail ou senha incorretos." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "E-mail ou senha incorretos." };

  redirect("/admin");
}

export async function logout() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
