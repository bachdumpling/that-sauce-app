"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/auth-context";

export function Header() {
  const { user } = useAuth();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          Creative Talent Search
        </Link>
        <nav className="space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/search">Search</Link>
          </Button>
          {user?.role === "admin" && (
            <Button asChild>
              <Link href="/admin">Admin</Link>
            </Button>
          )}
          <Button asChild>
            {user ? (
              <Link href="/profile">Profile </Link>
            ) : (
              <Link href="/auth/login">Sign In</Link>
            )}
          </Button>
        </nav>
      </div>
    </header>
  );
}
