"use client";

import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Link from "next/link";
import Image from "next/image";
import NavClient from "@/components/nav-client";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { usePathname } from "next/navigation";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile menu when a link is clicked
  const handleLinkClick = () => {
    setOpen(false);
  };

  // Check if the current path is admin related
  const isAdmin = pathname?.includes("/admin");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[350px] sm:w-[400px]">
        <SheetHeader className="mb-8">
          <SheetTitle className="flex items-center justify-center">
            <Link href="/" onClick={handleLinkClick}>
              <Image
                src="/logo.png"
                alt="that sauce"
                width={50}
                height={50}
                priority
                className="transition-transform hover:scale-105"
              />
            </Link>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 bg-accent/20 p-4 rounded-lg">
            <NavClient />
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm font-medium">Theme</span>
              <ThemeSwitcher />
            </div>
          </div>

          <div className="">
            <nav className="flex flex-col">
              {isAdmin && (
                <>
                  <div className="mt-4 mb-2 px-4">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                      Admin
                    </span>
                  </div>
                  <Link
                    href="/admin/creators"
                    className="px-4 py-3 rounded-md hover:bg-accent transition-colors flex items-center gap-2 font-medium"
                    onClick={handleLinkClick}
                  >
                    Creator Management
                  </Link>
                  <Link
                    href="/admin/creators/rejected"
                    className="px-4 py-3 rounded-md hover:bg-accent transition-colors flex items-center gap-2 font-medium"
                    onClick={handleLinkClick}
                  >
                    Rejected Creators
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
