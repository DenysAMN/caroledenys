import { createClient } from "@supabase/supabase-js";

// Cliente ADMIN (service_role) — SÓ SERVIDOR. Ignora o RLS, então só pode ser
// importado por Server Actions / Route Handlers, NUNCA por componente de cliente.
// A chave vem de SUPABASE_SERVICE_ROLE_KEY (sem NEXT_PUBLIC_ = nunca vai pro browser).
// É por aqui que escrevemos em `guests` e `claims`. (Regra nº 3)

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function createAdminClient() {
  if (!url || !serviceKey) {
    throw new Error(
      "Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no .env.local"
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
