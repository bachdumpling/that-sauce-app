import "./globals.css";
import { Header } from "@/components/layout/Header";
import { AuthProvider } from "@/lib/context/auth-context";
import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <html lang="en">
        <body suppressHydrationWarning={true}>
          <Header />
          <main className="container mx-auto px-4 py-8">{children}</main>
          <Analytics />
        </body>
      </html>
    </AuthProvider>
  );
}
