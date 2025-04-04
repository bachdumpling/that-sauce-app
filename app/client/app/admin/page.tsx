"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminHomePage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/admin/creators");
  }, [router]);

  return <div>Redirecting to creator management...</div>;
}
