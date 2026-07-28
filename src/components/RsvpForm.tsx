"use client";

import { useState, useTransition } from "react";
import { saveRsvp } from "@/app/actions/rsvp";
import { getGuestToken, saveGuestToken } from "@/lib/guest-storage";

type Attendance = "CONFIRMADO" | "NAO_VOU";

export default function RsvpForm() {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [attendance, setAttendance] = useState<Attendance>("CONFIRMADO");
  const [companions, setCompanions] = useState(0);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState<Attendance | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    startTransition(async () => {
      const result = await saveRsvp({
        name,
        whatsapp,
        attendance,
        companions,
        notes,
        guestToken: getGuestToken(),
      });
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      saveGuestToken(result.guestToken);
      setDone(result.attendance);
    });
  }

  if (done) {
    return (
      <div className="rsvp-success" role="status">
        <span aria-hidden="true">C &amp; D</span>
        <p className="eyebrow">Resposta recebida</p>
        <h2>
          {done === "CONFIRMADO"
            ? "Que alegria ter você com a gente!"
            : "Vamos sentir sua falta."}
        </h2>
        <p>
          {done === "CONFIRMADO"
            ? "Sua presença ficou anotada para 31 de janeiro de 2027."
            : "Sua resposta ficou anotada. Obrigado por nos avisar com carinho."}
        </p>
        <button className="btn btn-ghost" type="button" onClick={() => setDone(null)}>
          Alterar resposta
        </button>
      </div>
    );
  }

  return (
    <form className="rsvp-card" onSubmit={submit}>
      <header className="rsvp-card-head">
        <p className="eyebrow">Répondez s&apos;il vous plaît</p>
        <h2>Você vem celebrar conosco?</h2>
        <p>Domingo, 31 de janeiro de 2027, às 16h</p>
      </header>

      <fieldset className="rsvp-choice">
        <legend>Sua resposta</legend>
        <label className={attendance === "CONFIRMADO" ? "selected" : ""}>
          <input
            type="radio"
            name="attendance"
            value="CONFIRMADO"
            checked={attendance === "CONFIRMADO"}
            onChange={() => setAttendance("CONFIRMADO")}
          />
          <span>Sim, estarei lá</span>
          <small>Mal posso esperar</small>
        </label>
        <label className={attendance === "NAO_VOU" ? "selected" : ""}>
          <input
            type="radio"
            name="attendance"
            value="NAO_VOU"
            checked={attendance === "NAO_VOU"}
            onChange={() => setAttendance("NAO_VOU")}
          />
          <span>Não poderei ir</span>
          <small>Mas estarei torcendo por vocês</small>
        </label>
      </fieldset>

      <div className="rsvp-fields">
        <label className="field">
          <span>Seu nome</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            placeholder="Como devemos colocar na lista?"
            maxLength={120}
            required
          />
        </label>
        <label className="field">
          <span>WhatsApp com DDD</span>
          <input
            value={whatsapp}
            onChange={(event) => setWhatsapp(event.target.value)}
            autoComplete="tel"
            inputMode="tel"
            placeholder="(22) 99999-9999"
            required
          />
        </label>
        {attendance === "CONFIRMADO" && (
          <label className="field">
            <span>Quantos acompanhantes vão com você?</span>
            <input
              type="number"
              inputMode="numeric"
              value={companions}
              onChange={(event) => setCompanions(Number(event.target.value))}
              min={0}
              max={20}
              required
            />
          </label>
        )}
        <label className="field">
          <span>Observação ou recado (opcional)</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Restrição alimentar, acessibilidade ou um carinho para nós…"
          />
        </label>
      </div>

      {message && <p className="field-error" role="alert">{message}</p>}
      <p className="rsvp-privacy">
        Usaremos seu nome e telefone somente para organizar o casamento. Não
        compartilhamos esses dados e seu telefone nunca aparece no mural.
      </p>
      <button className="btn rsvp-submit" type="submit" disabled={pending}>
        {pending ? "Guardando sua resposta…" : "Enviar confirmação"}
      </button>
    </form>
  );
}
