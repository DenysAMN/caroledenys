// Guarda o token do convidado no localStorage do navegador.
// É a "identidade sem login": na S6 (/meus) usamos esse token para mostrar à
// pessoa o que ela reservou. Nunca guardamos telefone aqui.

const TOKEN_KEY = "cd_guest_token";

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
