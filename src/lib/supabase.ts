import { createClient } from "@supabase/supabase-js";

// Cliente PÚBLICO (anon key) — usado só para LER `gifts`, protegido pelo RLS.
// A anon key é feita para ficar exposta no navegador; o RLS garante que só
// presentes não-OCULTO apareçam. A service_role (secreta) NUNCA entra aqui —
// ela fica no servidor, para `guests`/`claims`, nas próximas sessões. (Regra nº 3)

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);

export function createPublicClient() {
  if (!url || !anonKey) {
    throw new Error(
      "Faltam NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local"
    );
  }
  return createClient(url, anonKey, { auth: { persistSession: false } });
}
