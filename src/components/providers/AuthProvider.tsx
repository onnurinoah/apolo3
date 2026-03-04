"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { migrateLocalStorageToSupabase } from "@/lib/migration";
import { isAuthBypassMode } from "@/lib/auth-mode";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const bypassAuth = isAuthBypassMode();
  const router = useRouter();
  const { user, loading } = useAuth();
  const migratedRef = useRef(false);

  useEffect(() => {
    if (bypassAuth) return;
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [bypassAuth, loading, user, router]);

  useEffect(() => {
    if (bypassAuth) return;
    if (loading || !user || migratedRef.current) return;
    migratedRef.current = true;
    void migrateLocalStorageToSupabase(user.id);
  }, [bypassAuth, loading, user]);

  if (bypassAuth) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-sm text-gray-500">
        로그인 확인 중...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
