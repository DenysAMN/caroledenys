// Guarda o token do convidado no localStorage do navegador.
// É a "identidade sem login": na S6 (/meus) usamos esse token para mostrar à
// pessoa o que ela reservou. Nunca guardamos telefone aqui.

const TOKEN_KEY = "cd_guest_token";
const CLAIM_ACCESS_PREFIX = "cd_claim_access_";

export function saveGuestToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // navegador sem localStorage (aba privada antiga) — segue sem guardar
  }
}

export function getGuestToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveClaimAccessToken(claimId: string, token: string): void {
  try {
    localStorage.setItem(`${CLAIM_ACCESS_PREFIX}${claimId}`, token);
  } catch {
    // Sem localStorage, o convidado precisará refazer a reserva para enviar o comprovante.
  }
}

export function getClaimAccessToken(claimId: string): string | null {
  try {
    return localStorage.getItem(`${CLAIM_ACCESS_PREFIX}${claimId}`);
  } catch {
    return null;
  }
}
