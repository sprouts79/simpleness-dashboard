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
            <div className="max-w-[1400px] px-8 py-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
