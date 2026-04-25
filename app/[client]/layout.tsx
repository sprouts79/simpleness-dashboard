import { getClient } from "@/lib/db";
import { notFound } from "next/navigation";
import DataSources from "@/components/ui/DataSources";

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
    <>
      {/* Sub-header: datakilder + sist oppdatert. Klient-navn ligger i sidebar. */}
      <div className="flex items-center justify-between mb-5">
        <DataSources sources={["meta"]} />
        <span
          className="text-xs text-neutral-500 capitalize tabular-nums"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {now}
        </span>
      </div>
      {children}
    </>
  );
}
