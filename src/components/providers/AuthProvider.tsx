"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { migrateLocalStorageToSupabase } from "@/lib/migration";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const migratedRef = useRef(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (loading || !user || migratedRef.current) return;
    migratedRef.current = true;
    void migrateLocalStorageToSupabase(user.id);
  }, [loading, user]);

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
