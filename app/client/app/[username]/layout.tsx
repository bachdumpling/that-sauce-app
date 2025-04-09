import { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { serverApi } from "@/lib/api/index";
import { createClient } from "@/utils/supabase/server";
import { CreatorHeader } from "./components/creator-header";
import { TabsNav } from "./components/tabs-nav";
import React from "react";
import { Creator } from "@/lib/api/shared/types";
import { cn } from "@/lib/utils";
import { notFound } from "next/navigation";

// Props that will be passed to child components
interface CreatorPageProps {
  creator: Creator;
}

export default async function CreatorLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { username: string };
}) {
  // Await the params object before destructuring
  const resolvedParams = await Promise.resolve(params);
  const { username } = resolvedParams;

  // Get creator data server-side
  const response = await serverApi.getCreatorByUsernameServer(username);

  // Handle creator not found - use Next.js notFound() to show the not-found.tsx component
  if (!response.success) {
    console.error("Creator not found:", response.error);
    notFound();
  }

  const creator = response.data;

  // If creator is still null or undefined, show not found
  if (!creator) {
    console.error("Creator data is null or undefined");
    notFound();
  }

  return (
    <>
      <div className="container w-full max-w-7xl mx-auto">
        <CreatorHeader creator={creator} username={username} />
        <TabsNav creator={creator} username={username} />

        <CreatorPageContent creator={creator}>{children}</CreatorPageContent>
      </div>
      <Toaster />
    </>
  );
}

// Component to display children with creator props
function CreatorPageContent({
  children,
  creator,
}: {
  children: React.ReactNode;
  creator: Creator;
}) {
  try {
    // Only clone if children is a valid React element
    if (React.isValidElement(children)) {
      return React.cloneElement(
        children as React.ReactElement<CreatorPageProps>,
        {
          creator,
        }
      );
    }
    // Fallback if children is not a valid React element (shouldn't normally happen)
    return children;
  } catch (error) {
    return (
      <div className="py-6">
        <p className="text-red-500">Error rendering page content</p>
      </div>
    );
  }
}
