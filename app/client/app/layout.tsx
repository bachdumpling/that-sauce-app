import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import localFont from "next/font/local";
import { MobileNav } from "@/components/mobile-nav";

const defaultUrl = process.env.NEXT_PUBLIC_CLIENT_URL
  ? `https://${process.env.NEXT_PUBLIC_CLIENT_URL}`
  : "https://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "that sauce",
  description: "creative talent search engine",
};

// Define Helvetica Neue as a local font
const helveticaNeue = localFont({
  src: [
    {
      path: "./fonts/HelveticaNeueLight.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/HelveticaNeueLightItalic.otf",
      weight: "300",
      style: "italic",
    },
    {
      path: "./fonts/HelveticaNeueRoman.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/HelveticaNeueItalic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "./fonts/HelveticaNeueMedium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/HelveticaNeueMediumItalic.otf",
      weight: "500",
      style: "italic",
    },
    {
      path: "./fonts/HelveticaNeueBold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/HelveticaNeueBoldItalic.otf",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-helvetica-neue",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${helveticaNeue.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen flex flex-col items-center">
            <div className="flex-1 w-full flex flex-col gap-20 items-center">
              <nav className="w-full flex justify-center border-b border-b-foreground/10 h-20">
                <div className="w-full max-w-6xl flex justify-between items-center p-2 px-4 text-sm">
                  <div className="flex gap-4 items-center font-semibold">
                    <Link href={"/"}>
                      <Image
                        src="/logo.png"
                        alt="that sauce"
                        width={50}
                        height={50}
                        priority
                      />
                    </Link>
                  </div>
                  {/* Desktop navigation */}
                  <div className="hidden md:flex gap-4 items-center">
                    <HeaderAuth />
                    <ThemeSwitcher />
                  </div>
                  {/* Mobile navigation */}
                  <div className="md:hidden">
                    <MobileNav />
                  </div>
                </div>
              </nav>
              <main className="flex-1 container max-w-6xl w-full mx-auto">
                {children}
              </main>

              <footer className="w-full flex flex-col items-center justify-center border-t mx-auto text-center text-xs py-16">
                <Image
                  src="/logo.png"
                  alt="that sauce"
                  width={100}
                  height={100}
                />
                <p>that sauce 2025</p>
              </footer>
            </div>
          </main>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
