const destination = encodeURIComponent(
  "Casa do Lago, Rua Beija-flor, Costazul, Rio das Ostras - RJ, 28895-048"
);

export default function VenueMap() {
  return (
    <div className="venue-map">
      <iframe
        title="Mapa da Casa do Lago em Rio das Ostras"
        src={`https://www.google.com/maps?q=${destination}&output=embed&hl=pt-BR`}
        width="100%"
        height="340"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      <a
        className="btn nos-map-link"
        href={`https://www.google.com/maps/dir/?api=1&destination=${destination}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Como chegar · Google Maps <span aria-hidden="true">↗</span>
      </a>
    </div>
  );
}
