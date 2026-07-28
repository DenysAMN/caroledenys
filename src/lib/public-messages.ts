import { createPublicClient, supabaseConfigured } from "@/lib/supabase";

export type PublicMessage = {
  name: string;
  message: string;
  source: "PRESENTE" | "RSVP";
  createdAt: string;
};

export async function getPublicMessages(): Promise<PublicMessage[]> {
  if (!supabaseConfigured) return [];

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("public_messages")
    .select("name, message, source, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("public messages:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    name: row.name,
    message: row.message,
    source: row.source as "PRESENTE" | "RSVP",
    createdAt: row.created_at,
  }));
}
