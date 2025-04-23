import { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { CreatorHeader } from "./components/creator-header";
import { TabsNav } from "./components/tabs-nav";
import { Creator } from "@/client/types";
import { checkCreatorExistsAction } from "@/actions/creator-actions";

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
  const { username } = params;

  // Fetch creator data
  let creator;
  try {
    creator = await checkCreatorExistsAction(username);

    // If no creator was found, just return the children
    // The page component will handle the notFound() call
    if (!creator) {
      return children;
    }
  } catch (error) {
    console.error("Error fetching creator:", error);
    // Let the page component handle the notFound() call
    return children;
  }

  return (
    <>
      <div className="container w-full max-w-7xl mx-auto">
        <CreatorHeader creator={creator} username={username} />
        <TabsNav creator={creator} username={username} />
        {children}
      </div>
      <Toaster />
    </>
  );
}
