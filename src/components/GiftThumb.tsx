// Placeholder decorativo para presentes sem foto (fotos reais entram na S8).
// Um raminho simples, no tom do sistema. aria-hidden: é só enfeite.
export default function GiftThumb() {
  return (
    <svg width="72" height="72" viewBox="0 0 24 24" fill="none"
      stroke="#B99C6B" strokeWidth="1" strokeLinecap="round" aria-hidden="true">
      <path d="M12 21 V6 M12 10 C9.5 9 7 9.5 5.5 12 M12 10 C14.5 9 17 9.5 18.5 12 M12 15 C10.2 14.4 8.6 14.8 7.5 16.5 M12 15 C13.8 14.4 15.4 14.8 16.5 16.5" />
      <circle cx="12" cy="4.4" r="1.6" />
    </svg>
  );
}
