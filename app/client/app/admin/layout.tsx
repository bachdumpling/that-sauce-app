import { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AdminProtection } from "@/app/admin/components/admin-protection";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProtection>
      <div className="container w-full max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {children}
      </div>
      <Toaster />
    </AdminProtection>
  );
}
