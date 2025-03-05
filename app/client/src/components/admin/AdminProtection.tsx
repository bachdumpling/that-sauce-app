"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const AdminProtection = ({ children }) => {
  const { user, isLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (data && data.role === "admin") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error("Error checking admin role:", err);
        setIsAdmin(false);
      } finally {
        setCheckingRole(false);
      }
    };

    if (!isLoading) {
      if (!user) {
        setCheckingRole(false);
      } else {
        checkAdminRole();
      }
    }
  }, [user, isLoading]);

  // Show loading state
  if (isLoading || checkingRole) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-[350px]">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-center">Checking permissions...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not logged in
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
            <Button
              onClick={() => router.push("/auth/login")}
              className="w-full"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not an admin
  if (!isAdmin) {
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
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="w-full"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Is admin - show content
  return <>{children}</>;
};
