import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OC/OS - PACIFICO SRL",
  description: "Sistema de ordenes de compra y ordenes de servicio",
  icons: {
    icon: "/brand/logo1.png",
    shortcut: "/brand/logo1.png",
    apple: "/brand/logo1.png",
  },
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
