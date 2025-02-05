// src/app/onboarding/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";
import { useCreatorSetup } from "@/lib/hooks/useCreatorSetup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default function OnboardingPage() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { setupCreator, loading } = useCreatorSetup();
  const router = useRouter();

  if (!user) {
    router.push("/auth/login"); 
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (!username.trim()) {
        setError("Username is required");
        return;
      }

      await setupCreator(user.id, username.trim());
      router.push("/profile"); // Or wherever you want to redirect after setup
    } catch (err: any) {
      if (err.message.includes("creators_username_key")) {
        setError("This username is already taken");
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="container max-w-lg py-8">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold text-center">
            Complete Your Profile
          </h1>
          <p className="text-muted-foreground text-center">
            Choose a username to get started
          </p>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a unique username"
                disabled={loading}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Setting up..." : "Continue"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
