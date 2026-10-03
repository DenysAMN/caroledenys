import Image from "next/image";

const reservedColors = [
  { name: "Branco", color: "#ffffff" },
  { name: "Off-white", color: "#f5f2e9" },
  { name: "Creme", color: "#ead9b5" },
  { name: "Marsala", color: "#803e4c" },
];

export default function DressCode() {
  return (
    <section id="dress-code" className="section dress-code home-anchor-section" aria-labelledby="dress-code-title">
      <div className="container">
        <p className="eyebrow">Para celebrar com a gente</p>
        <h2 id="dress-code-title">Dress code</h2>
        <p className="dress-code-intro">Escolha um look em que você se sinta bem para celebrar com a gente. Separamos algumas inspirações para ajudar na escolha.</p>
        <div className="dress-code-rules">
          <h3>Um cuidado com as cores</h3>
          <p>Pedimos que os convidados <strong>não usem branco, off-white, creme ou marsala</strong>.</p>
          <ul className="dress-code-swatches" aria-label="Cores que não devem ser usadas">
            {reservedColors.map(({ name, color }) => (
              <li key={name}><span style={{ backgroundColor: color }} aria-hidden="true" />{name}</li>
            ))}
          </ul>
          <p>Para quem escolher terno, pedimos também que <strong>evite o preto</strong>.</p>
        </div>
        <div className="dress-code-examples">
          <figure>
            <Image src="/images/dress-code/vestidos.webp" width={1200} height={800} sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 520px" alt="Ilustração de três convidadas com vestidos midi e longo em verde, azul e terracota." />
            <figcaption><h3>Inspirações de vestidos</h3><p>Verde, azul e terracota são algumas opções. O modelo e o comprimento ficam a seu gosto.</p></figcaption>
          </figure>
          <figure>
            <Image src="/images/dress-code/ternos.webp" width={1200} height={800} sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 520px" alt="Ilustração de três convidados com ternos azul, cinza médio e verde oliva, camisas azul-claro e sapatos marrons." />
            <figcaption><h3>Inspirações de ternos</h3><p>Azul, cinza médio e verde são alternativas ao terno preto para compor o seu look.</p></figcaption>
          </figure>
        </div>
        <p className="dress-code-note">As imagens são apenas referências de cores e combinações. Não é necessário usar os mesmos modelos. Obrigado por cuidarem desse detalhe com a gente!</p>
      </div>
    </section>
  );
}
