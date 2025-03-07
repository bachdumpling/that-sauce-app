import { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AdminProtection } from "@/components/admin/AdminProtection";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProtection>
      <div className="container px-4 py-8 mx-auto md:max-w-6xl w-full">
        {children}
      </div>
      <Toaster />
    </AdminProtection>
  );
}
