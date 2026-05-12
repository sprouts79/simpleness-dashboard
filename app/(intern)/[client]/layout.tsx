import { getClient } from "@/lib/db";
import { notFound } from "next/navigation";
import ClientSubHeader from "@/components/layout/ClientSubHeader";

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
      <ClientSubHeader now={now} />
      {children}
    </>
  );
}
