import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface AdminProtectionProps {
  children: React.ReactNode;
}

export async function AdminProtection({ children }: AdminProtectionProps) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not logged in, show authentication required
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-[350px]">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Lock className="h-12 w-12 mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
            <p className="text-center text-muted-foreground mb-4">
              Please sign in to access this area.
            </p>
            <Button asChild className="w-full">
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is admin
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !data || data.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-[350px]">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <AlertTriangle className="h-12 w-12 mb-4 text-destructive" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-center text-muted-foreground mb-4">
              You do not have permission to access this area.
            </p>
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                This area is restricted to admin users only.
              </AlertDescription>
            </Alert>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Return to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Is admin - show content
  return <>{children}</>;
}
