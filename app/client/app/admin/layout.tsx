import { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AdminProtection } from "@/components/admin/AdminProtection";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProtection>
      <div className="min-h-screen max-w-7xl mx-auto bg-background">
        {children}
        <Toaster />
      </div>
    </AdminProtection>
  );
}
