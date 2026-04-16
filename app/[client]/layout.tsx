import { getClient } from "@/lib/db";
import ClientTabNav from "@/components/layout/ClientTabNav";
import { notFound } from "next/navigation";

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
      <header className="border-b border-[var(--color-border)] bg-white sticky top-0 z-10">
        <div className="px-8 pt-6 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold">{client.name}</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded border border-[var(--color-border)] text-[rgba(9,10,8,0.45)] tracking-wide">
                META ADS
              </span>
            </div>
            <span
              className="text-xs text-[rgba(9,10,8,0.4)] capitalize"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {now}
            </span>
          </div>
          <ClientTabNav clientSlug={slug} />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {children}
      </div>
    </div>
  );
}
