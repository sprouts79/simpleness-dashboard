import { Suspense } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { getClients } from "@/lib/db";

export default async function InternLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clients = await getClients();

  return (
    <div className="flex h-screen overflow-hidden">
      <Suspense fallback={<aside className="w-64 flex-shrink-0 h-full bg-white" />}>
        <Sidebar clients={clients} />
      </Suspense>
      <main className="flex-1 overflow-y-auto bg-neutral-50">
        <div className="max-w-[1400px] px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
