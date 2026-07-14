import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Carol & Denys · 31.01.2027",
  description:
    "O casamento da Carol e do Denys — à beira do lago, em Rio das Ostras. Lista de presentes e confirmação de presença.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${cormorant.variable} ${jost.variable}`}>
      <body>
        <header className="site-header">
          <div className="container">
            <Link href="/" className="monogram">
              C &amp; D
            </Link>
            <nav className="nav">
              <Link href="/presentes">Presentes</Link>
              <Link href="/confirmar">Presença</Link>
              <Link href="/recados">Recados</Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div className="mono">Carol &amp; Denys</div>
          <p>31 de janeiro de 2027 · Casa do Lago · Rio das Ostras — RJ</p>
        </footer>
      </body>
    </html>
  );
}
