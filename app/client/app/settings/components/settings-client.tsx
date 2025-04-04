"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, User as UserIcon, ShieldCheck, CreditCard, LogOut } from "lucide-react";
import Link from "next/link";
import { signOutAction } from "@/app/actions";
import { updateProfile } from "@/lib/api/profile";

interface SettingsClientProps {
  user: User;
  profile: any | null;
  creator: {
    username?: string;
  } | null;
}

export function SettingsClient({ user, profile, creator }: SettingsClientProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [lastName, setLastName] = useState(profile?.last_name || "");

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    
    try {
      const response = await updateProfile({
        first_name: firstName,
        last_name: lastName
      });
      
      if (response.success) {
        toast.success(response.message || "Profile updated successfully");
      } else {
        toast.error(response.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="profile">
          <UserIcon className="h-4 w-4 mr-2" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="account">
          <ShieldCheck className="h-4 w-4 mr-2" />
          Account
        </TabsTrigger>
        <TabsTrigger value="subscription">
          <CreditCard className="h-4 w-4 mr-2" />
          Subscription
        </TabsTrigger>
        <TabsTrigger value="more">More</TabsTrigger>
      </TabsList>
      
      <TabsContent value="profile" className="space-y-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal information and how others see you on the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Your first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Your last name"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user.email || ""}
                disabled
                className="opacity-70"
              />
              <p className="text-xs text-muted-foreground">
                Your email address is managed through your authentication provider.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Cancel</Button>
            <Button onClick={handleUpdateProfile} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {creator && creator.username && (
          <Card>
            <CardHeader>
              <CardTitle>Creator Profile</CardTitle>
              <CardDescription>
                Manage your creator profile and portfolio.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                You have a creator profile with the username:{" "}
                <span className="font-semibold">{creator.username}</span>
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href={`/${creator.username}`}>
                  Go to Creator Profile
                </Link>
              </Button>
            </CardFooter>
          </Card>
        )}
      </TabsContent>
      
      <TabsContent value="account" className="space-y-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Security</CardTitle>
            <CardDescription>
              Manage your account security and authentication settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Password</h3>
              <p className="text-sm text-muted-foreground">
                Your password is managed through your authentication provider.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Sign Out</h3>
              <p className="text-sm text-muted-foreground">
                Sign out from all devices.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <form action={signOutAction}>
              <Button type="submit" variant="destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </form>
          </CardFooter>
        </Card>
      </TabsContent>
      
      <TabsContent value="subscription" className="space-y-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plan</CardTitle>
            <CardDescription>
              Manage your subscription and billing information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="font-medium">
                Current Plan: <span className="font-normal">{profile?.tier || "Free"}</span>
              </h3>
              <p className="text-sm text-muted-foreground">
                You have used {profile?.search_count || 0} of your {profile?.max_searches || 10} available searches.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline">Upgrade Plan</Button>
          </CardFooter>
        </Card>
      </TabsContent>
      
      <TabsContent value="more" className="space-y-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Additional Settings</CardTitle>
            <CardDescription>
              Other settings and preferences for your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              More settings will be available soon.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 