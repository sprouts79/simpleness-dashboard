import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simpleness OS",
  description: "Simpleness OS — internt dashboard og kundefasade",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="no">
      <body>{children}</body>
    </html>
  );
}
