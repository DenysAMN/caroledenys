"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  finalizarComprovante,
  prepararUploadComprovante,
} from "@/app/actions/enviar-comprovante";
import { getClaimAccessToken } from "@/lib/guest-storage";
import { createPublicClient } from "@/lib/supabase";
import {
  RECEIPT_BUCKET,
  validateReceiptMetadata,
} from "@/lib/receipt-validation";

function errorMessage(code: string): string {
  switch (code) {
    case "NAO_AUTORIZADO":
      return "Não encontramos esta reserva neste aparelho. Volte ao presente e reserve novamente.";
    case "RESERVA_EXPIRADA":
      return "O tempo da reserva terminou. Volte à lista e reserve as cotas novamente.";
    case "ARQUIVO_INVALIDO":
      return "Envie uma imagem JPG, PNG, WebP ou PDF de até 5 MB.";
    case "DADOS_INVALIDOS":
      return "Digite o nome de quem fez o PIX como aparece no comprovante.";
    default:
      return "Não foi possível enviar agora. Confira sua conexão e tente novamente.";
  }
}

export default function ReceiptUploadForm({ claimId }: { claimId: string }) {
  const router = useRouter();
  const [payerName, setPayerName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!file) {
      setError("Escolha a foto ou o PDF do comprovante.");
      return;
    }

    const metadata = validateReceiptMetadata({
      payerName,
      mimeType: file.type,
      size: file.size,
    });
    if (!metadata.ok) {
      setError(
        errorMessage(
          metadata.error === "PAYER_NAME_INVALID"
            ? "DADOS_INVALIDOS"
            : "ARQUIVO_INVALIDO"
        )
      );
      return;
    }

    const claimAccessToken = getClaimAccessToken(claimId);
    if (!claimAccessToken) {
      setError(errorMessage("NAO_AUTORIZADO"));
      return;
    }

    setPending(true);
    try {
      const prepared = await prepararUploadComprovante({
        claimId,
        claimAccessToken,
        payerName: metadata.payerName,
        mimeType: file.type,
        size: file.size,
      });
      if (!prepared.ok) {
        setError(errorMessage(prepared.error));
        return;
      }

      if (prepared.uploadToken) {
        const publicClient = createPublicClient();
        const { error: uploadError } = await publicClient.storage
          .from(RECEIPT_BUCKET)
          .uploadToSignedUrl(prepared.path, prepared.uploadToken, file, {
            contentType: file.type,
            upsert: false,
          });
        if (uploadError) {
          console.error("uploadToSignedUrl:", uploadError.message);
          setError(errorMessage("ERRO"));
          return;
        }
      }

      const finished = await finalizarComprovante({
        claimId,
        claimAccessToken,
        payerName: metadata.payerName,
        path: prepared.path,
      });
      if (!finished.ok) {
        setError(errorMessage(finished.error));
        return;
      }

      router.push("/obrigado");
    } catch (cause) {
      console.error("receipt upload:", cause);
      setError(errorMessage("ERRO"));
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="receipt-form" onSubmit={submit}>
      <p className="eyebrow">Depois de pagar</p>
      <h3>Envie o comprovante</h3>
      <p className="receipt-help">
        O nome precisa ser o mesmo que aparece no extrato — mesmo que o PIX tenha
        saído da conta de outra pessoa.
      </p>

      <label className="field">
        <span>Nome de quem fez o PIX</span>
        <input
          value={payerName}
          onChange={(event) => setPayerName(event.target.value)}
          placeholder="Como aparece no comprovante"
          autoComplete="name"
          required
        />
      </label>

      <label className="field">
        <span>Foto ou PDF do comprovante</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          required
        />
      </label>
      <p className="receipt-limit">JPG, PNG, WebP ou PDF · máximo 5 MB</p>

      {error && (
        <p className="field-error" role="alert" aria-live="polite">
          {error}
        </p>
      )}

      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Enviando comprovante…" : "Enviar comprovante"}
      </button>
    </form>
  );
}
