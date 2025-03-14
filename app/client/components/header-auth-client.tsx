"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function HeaderAuthClient() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    };

    getUser();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  if (loading) {
    return <div className="h-9 w-20 bg-muted animate-pulse rounded-md"></div>;
  }

  return user ? (
    <div className="flex flex-col gap-2 w-full">
      <span className="text-sm text-center py-4">Hey, {user.email}!</span>
      <Button
        onClick={handleSignOut}
        variant={"outline"}
        size="sm"
        className="w-full justify-center py-4"
      >
        Sign out
      </Button>
      <Button
        asChild
        size="sm"
        variant={"outline"}
        className="w-full justify-center py-4"
      >
        <Link href="/profile">Profile</Link>
      </Button>
      <Button
        asChild
        size="sm"
        variant={"outline"}
        className="w-full justify-center py-4"
      >
        <Link href="/search">Search</Link>
      </Button>
      {user.email?.includes("ohos.nyc") && (
        <Button
          asChild
          size="sm"
          variant={"outline"}
          className="w-full justify-center py-4"
        >
          <Link href="/admin">Admin</Link>
        </Button>
      )}
    </div>
  ) : (
    <div className="flex flex-col gap-2 w-full">
      <Button
        asChild
        size="sm"
        variant={"outline"}
        className="w-full justify-start"
      >
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button
        asChild
        size="sm"
        variant={"default"}
        className="w-full justify-start"
      >
        <Link href="/sign-up">Sign up</Link>
      </Button>
      <Button
        asChild
        size="sm"
        variant={"outline"}
        className="w-full justify-start"
      >
        <Link href="/search">Search</Link>
      </Button>
    </div>
  );
}
