import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import Link from "next/link";
import { PRIMARY_NAV_ITEMS } from "@/lib/site-navigation";
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
  metadataBase: new URL("https://caroledenys.vercel.app"),
  title: {
    default: "Carol & Denys · 31.01.2027",
    template: "%s · Carol & Denys",
  },
  description:
    "O casamento da Carol e do Denys na Casa do Lago, em Rio das Ostras. Lista de presentes e confirmação de presença.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Carol & Denys",
    title: "Carol & Denys · 31.01.2027",
    description:
      "Nosso casamento na Casa do Lago, em Rio das Ostras. Veja os detalhes, confirme sua presença e conheça nossa lista.",
  },
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
              {PRIMARY_NAV_ITEMS.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
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
