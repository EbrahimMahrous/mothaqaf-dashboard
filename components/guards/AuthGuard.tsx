"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Spinner } from "@/components/ui/Spinner";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAuth();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Once the download is complete, we determine whether an admin is present.
    if (!loading) {
      if (!admin) {
        router.replace("/login");
      } else {
        setReady(true);
      }
    }
  }, [admin, loading, router]);

  // We always show a fallback (Spinner) until we’re certain
  // and we don’t return null, so as not to break the render tree
  if (loading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}
