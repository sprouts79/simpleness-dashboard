import { getClient } from "@/lib/db";
import { notFound } from "next/navigation";

// Force all client pages (performance, reach, creative) to be server-rendered
// on every request so they always show the latest data from Supabase.
export const dynamic = "force-dynamic";

export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ client: string }>;
}) {
  const { client: slug } = await params;
  const client = await getClient(slug);
  if (!client) notFound();

  // Klient-navn ligger i sidebar-pickeren — ikke vis det her igjen.
  // Denne layouten er nå en pass-through; legges igjen som hook-punkt
  // hvis vi senere trenger klient-spesifikk header (eks. live-status).
  return <>{children}</>;
}
