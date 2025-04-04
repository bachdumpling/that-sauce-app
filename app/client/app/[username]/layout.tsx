import { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

export default function UserProfileLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <div className="container w-full max-w-7xl mx-auto">
        {children}
      </div>
      <Toaster />
    </>
  );
}
