import { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AdminProtection } from "@/app/admin/components/admin-protection";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProtection>
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {children}
      </div>
      <Toaster />
    </AdminProtection>
  );
}
