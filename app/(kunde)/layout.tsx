export default function KundeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="max-w-[900px] mx-auto px-6 py-12 sm:py-16">{children}</div>
    </main>
  );
}
