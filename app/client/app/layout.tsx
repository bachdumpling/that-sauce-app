import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";
import "@/styles/nprogress-custom.css";
import { Analytics } from "@vercel/analytics/react";
import localFont from "next/font/local";
import { MobileNav } from "@/components/Nav/mobile-nav";
import { ProgressBar } from "@/components/ProgressBar";
import { ProgressBarProvider } from "@/providers/ProgressBarProvider";
import Nav from "@/components/Nav/nav";
import { ProfileEditProvider } from "@/contexts/ProfileEditContext";
const defaultUrl = process.env.NEXT_PUBLIC_CLIENT_URL
  ? `https://${process.env.NEXT_PUBLIC_CLIENT_URL}`
  : "https://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "that sauce",
  description: "creative talent search engine",
  openGraph: {
    title: "that sauce",
    description: "creative talent search engine",
    images: "/opengraph-image.png",
  },
  twitter: {
    title: "that sauce",
    description: "creative talent search engine",
    card: "summary_large_image",
    images: "/twitter-image.png",
  },
};

// Define Helvetica Neue as a local font
const helveticaNeue = localFont({
  src: [
    {
      path: "../public/fonts/HelveticaNeueLight.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/HelveticaNeueLightItalic.otf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../public/fonts/HelveticaNeueRoman.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/HelveticaNeueItalic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/HelveticaNeueMedium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/HelveticaNeueMediumItalic.otf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../public/fonts/HelveticaNeueBold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/HelveticaNeueBoldItalic.otf",
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
          <ProfileEditProvider>
            {/* <ProgressBarProvider> */}
            <main className="min-h-screen flex flex-col items-center">
              <div className="flex-1 w-full flex flex-col gap-10 items-center">
                <nav className="w-full flex justify-center h-20 px-4 py-2">
                  <div className="hidden md:flex w-full">
                    {/* Desktop navigation */}
                    <Nav />
                  </div>

                  {/* Mobile navigation */}
                  <div className="md:hidden w-full">
                    <MobileNav />
                  </div>
                </nav>

                <main className="flex-1 w-full mx-auto px-8">{children}</main>

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
            {/* </ProgressBarProvider> */}
          </ProfileEditProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
