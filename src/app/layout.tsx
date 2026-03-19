import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "COTI CAP",
  description: "Sistema de ordenes de compra y ordenes de servicio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
