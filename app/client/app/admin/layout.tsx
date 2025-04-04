import { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AdminProtection } from "@/app/admin/components/admin-protection";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProtection>
      <div className="container">{children}</div>
      <Toaster />
    </AdminProtection>
  );
}
