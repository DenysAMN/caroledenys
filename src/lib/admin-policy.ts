function normalizedEmail(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function isAllowedAdminEmail(
  email: string | null | undefined
): boolean {
  const allowed = normalizedEmail(process.env.ADMIN_EMAIL);
  return allowed.length > 0 && normalizedEmail(email) === allowed;
}
