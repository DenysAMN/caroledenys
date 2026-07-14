import "server-only";
import { createStaticPix, hasError } from "pix-utils";

// Gera o "copia e cola" PIX (BR Code / EMV). O CRC é calculado pela lib —
// NUNCA escrever à mão. Dados do recebedor vêm do ambiente (nunca versionados).

export function gerarPixBRCode(opts: { amountCents: number; txid: string }): string {
  const pixKey = process.env.PIX_KEY;
  const merchantName = process.env.PIX_MERCHANT_NAME;
  const merchantCity = process.env.PIX_MERCHANT_CITY;
  if (!pixKey || !merchantName || !merchantCity) {
    throw new Error("Faltam PIX_KEY / PIX_MERCHANT_NAME / PIX_MERCHANT_CITY no .env.local");
  }

  const pix = createStaticPix({
    merchantName,
    merchantCity,
    pixKey,
    txid: opts.txid,
    transactionAmount: opts.amountCents / 100, // centavos -> reais (a lib formata em 2 casas)
  });

  if (hasError(pix)) {
    throw new Error("Falha ao gerar PIX: " + JSON.stringify(pix));
  }
  return pix.toBRCode();
}
