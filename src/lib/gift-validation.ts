import type { GiftStatus, GiftType } from "@/lib/types";

const MAX_MONEY_CENTS = 100_000_000;
const MAX_IMAGE_BYTES = 4_000_000;

const IMAGE_EXTENSIONS: Record<string, "jpg" | "png" | "webp"> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type GiftWrite = {
  title: string;
  description: string | null;
  image_url?: string | null;
  type: GiftType;
  status: GiftStatus;
  category: string | null;
  sort_order: number;
  external_url: string | null;
  price_cents: number | null;
  total_cents: number | null;
  share_cents: number | null;
  total_shares: number | null;
  min_cents: number | null;
};

export type GiftFormResult =
  | { ok: true; gift: GiftWrite }
  | { ok: false; error: string };

export function parseBRLToCents(value: string): number | null {
  const raw = value.trim().replace(/^R\$\s*/i, "").replace(/\s/g, "");
  if (!raw) return null;

  let integerPart: string;
  let decimalPart = "";

  if (/^\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?$/.test(raw)) {
    const [whole, decimals = ""] = raw.split(",");
    integerPart = whole.replace(/\./g, "");
    decimalPart = decimals;
  } else if (/^\d+(?:[.,]\d{1,2})?$/.test(raw)) {
    const separator = raw.includes(",") ? "," : raw.includes(".") ? "." : "";
    const [whole, decimals = ""] = separator ? raw.split(separator) : [raw];
    integerPart = whole;
    decimalPart = decimals;
  } else {
    return null;
  }

  const cents = Number(integerPart) * 100 + Number(decimalPart.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 && cents <= MAX_MONEY_CENTS
    ? cents
    : null;
}

export function centsForInput(cents: number | null): string {
  if (cents == null) return "";
  const whole = Math.floor(cents / 100).toLocaleString("pt-BR");
  return `${whole},${String(cents % 100).padStart(2, "0")}`;
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(formData: FormData, key: string, max: number): string | null {
  const value = text(formData, key).replace(/\s+/g, " ").slice(0, max);
  return value || null;
}

export function parseGiftForm(formData: FormData): GiftFormResult {
  const title = text(formData, "title").replace(/\s+/g, " ");
  const type = text(formData, "type") as GiftType;
  const status = text(formData, "status") as GiftStatus;
  const sortOrder = Number(text(formData, "sort_order") || "0");

  if (title.length < 2 || title.length > 120) {
    return { ok: false, error: "Informe um título entre 2 e 120 caracteres." };
  }
  if (!(["LINK", "COTAS", "LIVRE"] as string[]).includes(type)) {
    return { ok: false, error: "Tipo de presente inválido." };
  }
  if (!(["DISPONIVEL", "RESERVADO", "CONCLUIDO", "OCULTO"] as string[]).includes(status)) {
    return { ok: false, error: "Status inválido." };
  }
  if (!Number.isSafeInteger(sortOrder) || sortOrder < -10_000 || sortOrder > 10_000) {
    return { ok: false, error: "A ordem deve ser um número inteiro." };
  }

  const gift: GiftWrite = {
    title,
    description: optionalText(formData, "description", 1000),
    type,
    status,
    category: optionalText(formData, "category", 60),
    sort_order: sortOrder,
    external_url: null,
    price_cents: null,
    total_cents: null,
    share_cents: null,
    total_shares: null,
    min_cents: null,
  };

  if (type === "LINK") {
    const externalUrl = text(formData, "external_url");
    try {
      const url = new URL(externalUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
    } catch {
      return { ok: false, error: "Informe o link da loja." };
    }
    const price = parseBRLToCents(text(formData, "price_reais"));
    if (price === null) return { ok: false, error: "Informe o preço do presente." };
    gift.external_url = externalUrl;
    gift.price_cents = price;
  }

  if (type === "COTAS") {
    const shareCents = parseBRLToCents(text(formData, "share_reais"));
    const totalShares = Number(text(formData, "total_shares"));
    if (shareCents === null) return { ok: false, error: "Informe o valor da cota." };
    if (!Number.isSafeInteger(totalShares) || totalShares < 1 || totalShares > 1_000) {
      return { ok: false, error: "A quantidade de cotas deve ficar entre 1 e 1.000." };
    }
    const totalCents = shareCents * totalShares;
    if (!Number.isSafeInteger(totalCents) || totalCents > MAX_MONEY_CENTS) {
      return { ok: false, error: "O valor total do presente é muito alto." };
    }
    gift.share_cents = shareCents;
    gift.total_shares = totalShares;
    gift.total_cents = totalCents;
  }

  if (type === "LIVRE") {
    const minCents = parseBRLToCents(text(formData, "min_reais"));
    if (minCents === null) return { ok: false, error: "Informe o valor mínimo." };
    gift.min_cents = minCents;
  }

  return { ok: true, gift };
}

export function validateGiftImageMetadata(mimeType: string, size: number) {
  const extension = IMAGE_EXTENSIONS[mimeType];
  if (!extension) return { ok: false as const, error: "TIPO_INVALIDO" as const };
  if (!Number.isSafeInteger(size) || size < 1 || size > MAX_IMAGE_BYTES) {
    return { ok: false as const, error: "TAMANHO_INVALIDO" as const };
  }
  return { ok: true as const, extension };
}
