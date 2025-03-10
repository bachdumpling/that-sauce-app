export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 flex flex-col gap-12 items-start">
      {children}
    </div>
  );
}
