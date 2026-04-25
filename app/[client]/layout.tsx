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

  const now = new Date().toLocaleDateString("no-NO", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex flex-col h-full">
      <header className="border-b border-neutral-200 bg-white">
        <div className="px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-neutral-900">{client.name}</h1>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider bg-neutral-100 text-neutral-700">
              Meta Ads
            </span>
          </div>
          <span
            className="text-xs text-neutral-500 capitalize tabular-nums"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {now}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-6">{children}</div>
    </div>
  );
}
