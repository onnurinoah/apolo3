"use client";

// TODO: 로그인 기능 활성화 시 useAuth + migration 활성화
// import { useEffect } from "react";
// import { useAuth } from "@/hooks/useAuth";
// import { migrateLocalStorageToSupabase } from "@/lib/migration";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // 로그인 보류 상태 — 바로 children 렌더링
  return <>{children}</>;
}
