import type { Metadata } from "next";
import { Jua, Montserrat_Alternates } from "next/font/google";
import "./globals.css";

// Подключаем шрифты
const jua = Jua({
  variable: "--font-jua",
  subsets: ["latin"],
  weight: "400",
});

const montserratAlternates = Montserrat_Alternates({
  variable: "--font-montserrat-alternates",
  subsets: ["latin", "cyrillic"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Visio",
  description: "Общайтесь и работайте вместе с Visio",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={`${montserratAlternates.variable} ${jua.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}