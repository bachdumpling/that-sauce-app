"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  mainRoutes,
  userAuthRoutes,
  userProfileRoutes,
  adminRoutes,
  creatorRoutes,
  isAdminEmail,
} from "./routes";

export default function NavClient() {
  const [user, setUser] = useState(null);
  const [creatorUsername, setCreatorUsername] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error("Error fetching user:", error);
          setUser(null);
        } else if (data?.user) {
          setUser(data.user);

          // Check if user has a creator profile
          const { data: creator } = await supabase
            .from("creators")
            .select("username")
            .eq("profile_id", data.user.id)
            .single();
          if (creator) {
            setCreatorUsername(creator.username);
          }
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setIsLoading(false);
      }
    }

    getUser();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        if (!session?.user) {
          setCreatorUsername(null);
        }
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

  if (isLoading) {
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

      {userProfileRoutes.map((route) => (
        <Button
          key={route.path}
          asChild
          size="sm"
          variant={"outline"}
          className="w-full justify-center py-4"
        >
          <Link href={route.path}>{route.label}</Link>
        </Button>
      ))}

      {creatorUsername && (
        <Button
          asChild
          size="sm"
          variant={"outline"}
          className="w-full justify-center py-4"
        >
          <Link href={`/${creatorUsername}`}>{creatorRoutes[0].label}</Link>
        </Button>
      )}

      {mainRoutes
        .filter((route) => route.path !== "/")
        .map((route) => (
          <Button
            key={route.path}
            asChild
            size="sm"
            variant={"outline"}
            className="w-full justify-center py-4"
          >
            <Link href={route.path}>{route.label}</Link>
          </Button>
        ))}

      {isAdminEmail(user.email) && (
        <Button
          asChild
          size="sm"
          variant={"outline"}
          className="w-full justify-center py-4"
        >
          <Link href={adminRoutes[0].path}>{adminRoutes[0].label}</Link>
        </Button>
      )}
    </div>
  ) : (
    <div className="flex flex-col gap-2 w-full">
      {userAuthRoutes.map((route) => (
        <Button
          key={route.path}
          asChild
          size="sm"
          variant={route.path === "/sign-up" ? "default" : "outline"}
          className="w-full justify-start"
        >
          <Link href={route.path}>{route.label}</Link>
        </Button>
      ))}

      {mainRoutes
        .filter((route) => route.path.includes("search"))
        .map((route) => (
          <Button
            key={route.path}
            asChild
            size="sm"
            variant={"outline"}
            className="w-full justify-start"
          >
            <Link href={route.path}>{route.label}</Link>
          </Button>
        ))}
    </div>
  );
}
