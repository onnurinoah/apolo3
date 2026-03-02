"use client";

import { useState, useEffect, useCallback } from "react";
import { EvangelismTarget, TargetStatus } from "@/types/target";
// TODO: 로그인 기능 활성화 시 Supabase 동기화 활성화
// import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "apolo_targets";

// ─── localStorage 헬퍼 ─────────────────────────────────
function loadFromStorage(): EvangelismTarget[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(data: EvangelismTarget[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable
  }
}

// ─── 유틸 함수 (외부 export) ─────────────────────────────

/** 연속 기도일수(스트릭) 계산 */
export function getPrayStreak(target: EvangelismTarget): number {
  if (!target.prayerDates.length) return 0;

  const sorted = [...target.prayerDates].sort().reverse();
  const today = new Date().toISOString().split("T")[0];

  let streak = 0;
  const checkDate = new Date(today);

  if (sorted[0] !== today) {
    checkDate.setDate(checkDate.getDate() - 1);
    if (sorted[0] !== checkDate.toISOString().split("T")[0]) return 0;
  }

  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split("T")[0];
    if (sorted.includes(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/** 마지막 기도일로부터 며칠 전인지 */
export function getDaysSinceLastPrayer(target: EvangelismTarget): number | null {
  if (!target.prayerDates.length) return null;
  const sorted = [...target.prayerDates].sort().reverse();
  const last = new Date(sorted[0]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  last.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── 메인 훅 (Supabase-first + localStorage 캐시) ───────

export function useTargets() {
  const [targets, setTargets] = useState<EvangelismTarget[]>([]);
  const [loaded, setLoaded] = useState(false);

  // 초기 로드: localStorage
  // TODO: 로그인 기능 활성화 시 Supabase-first 로드로 교체
  useEffect(() => {
    setTargets(loadFromStorage());
    setLoaded(true);
  }, []);

  // 낙관적 업데이트 + localStorage 캐시
  const persist = useCallback((data: EvangelismTarget[]) => {
    setTargets(data);
    saveToStorage(data);
  }, []);

  const addTarget = useCallback(
    (input: Omit<EvangelismTarget, "id" | "createdAt" | "prayerDates" | "status">) => {
      const newTarget: EvangelismTarget = {
        ...input,
        id: crypto.randomUUID(),
        status: "praying",
        createdAt: new Date().toISOString(),
        prayerDates: [],
      };
      persist([newTarget, ...targets]);
      return newTarget;
    },
    [targets, persist]
  );

  const updateTarget = useCallback(
    (id: string, updates: Partial<EvangelismTarget>) => {
      persist(targets.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    },
    [targets, persist]
  );

  const removeTarget = useCallback(
    (id: string) => {
      persist(targets.filter((t) => t.id !== id));
    },
    [targets, persist]
  );

  const updateStatus = useCallback(
    (id: string, status: TargetStatus) => {
      updateTarget(id, { status });
    },
    [updateTarget]
  );

  /** 오늘 기도 기록 (중복 방지) */
  const prayToday = useCallback(
    (id: string) => {
      const today = new Date().toISOString().split("T")[0];
      const target = targets.find((t) => t.id === id);
      if (!target) return;
      if (target.prayerDates.includes(today)) return;
      updateTarget(id, { prayerDates: [...target.prayerDates, today] });
    },
    [targets, updateTarget]
  );

  /** 오늘 기도했는지 확인 */
  const hasPrayedToday = useCallback(
    (id: string) => {
      const today = new Date().toISOString().split("T")[0];
      const target = targets.find((t) => t.id === id);
      return target?.prayerDates.includes(today) ?? false;
    },
    [targets]
  );

  const getTarget = useCallback(
    (id: string) => targets.find((t) => t.id === id) ?? null,
    [targets]
  );

  return {
    targets,
    loaded,
    addTarget,
    updateTarget,
    removeTarget,
    updateStatus,
    prayToday,
    hasPrayedToday,
    getTarget,
  };
}
