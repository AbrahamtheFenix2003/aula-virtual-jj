// 1. React/Next.js
import type { Metadata } from "next";

// 2. Third-party
import { Geist, Geist_Mono } from "next/font/google";

// 3. Internal (@/ alias)
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aula Virtual Jiu-Jitsu",
  description: "Plataforma de aprendizaje de Jiu-Jitsu brasileño",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
