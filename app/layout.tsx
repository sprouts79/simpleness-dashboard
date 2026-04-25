import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import { getClients } from "@/lib/db";

export const metadata: Metadata = {
  title: "Simpleness Dashboard",
  description: "Agency performance dashboard — Meta Ads",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clients = await getClients();

  return (
    <html lang="no">
      <body>
        <div className="flex h-screen overflow-hidden">
          <Sidebar clients={clients} />
          <main className="flex-1 overflow-y-auto bg-neutral-50">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
