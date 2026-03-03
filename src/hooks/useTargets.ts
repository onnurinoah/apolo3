"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { EvangelismTarget, TargetStatus } from "@/types/target";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "apolo_targets";

type TargetRow = {
  id: string | number;
  name: string;
  relationship: EvangelismTarget["relationship"];
  situation: string;
  interest: EvangelismTarget["interest"];
  notes: string | null;
  status: EvangelismTarget["status"];
  created_at: string;
  prayer_dates: string[] | null;
};

function toDbId(id: string) {
  if (/^\d+$/.test(id)) return Number(id);
  return id;
}

function mapRowToTarget(row: TargetRow): EvangelismTarget {
  return {
    id: String(row.id),
    name: row.name,
    relationship: row.relationship,
    situation: row.situation,
    interest: row.interest,
    notes: row.notes ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    prayerDates: row.prayer_dates ?? [],
  };
}

function toRowUpdates(updates: Partial<EvangelismTarget>) {
  const row: Record<string, unknown> = {};
  if (typeof updates.name === "string") row.name = updates.name;
  if (typeof updates.relationship === "string") row.relationship = updates.relationship;
  if (typeof updates.situation === "string") row.situation = updates.situation;
  if (typeof updates.interest === "string") row.interest = updates.interest;
  if (typeof updates.notes === "string" || updates.notes === undefined) {
    row.notes = updates.notes ?? null;
  }
  if (typeof updates.status === "string") row.status = updates.status;
  if (Array.isArray(updates.prayerDates)) row.prayer_dates = updates.prayerDates;
  if (typeof updates.createdAt === "string") row.created_at = updates.createdAt;
  return row;
}

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
export function getDaysSinceLastPrayer(
  target: EvangelismTarget
): number | null {
  if (!target.prayerDates.length) return null;
  const sorted = [...target.prayerDates].sort().reverse();
  const last = new Date(sorted[0]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  last.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
}

export function useTargets() {
  const [targets, setTargets] = useState<EvangelismTarget[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [useLocalFallback, setUseLocalFallback] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const persist = useCallback((data: EvangelismTarget[]) => {
    setTargets(data);
    saveToStorage(data);
  }, []);

  useEffect(() => {
    const local = loadFromStorage();
    setTargets(local);
    setLoaded(true);

    let active = true;
    async function loadRemote() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!active) return;

        setUserId(user?.id ?? null);
        if (!user) {
          setUseLocalFallback(true);
          return;
        }

        const { data, error } = await supabase
          .from("targets")
          .select(
            "id, name, relationship, situation, interest, notes, status, created_at, prayer_dates"
          )
          .order("created_at", { ascending: false });

        if (error) {
          setUseLocalFallback(true);
          return;
        }

        const mapped = (data as TargetRow[] | null)?.map(mapRowToTarget) ?? [];
        setUseLocalFallback(false);
        persist(mapped);
      } catch {
        if (!active) return;
        setUseLocalFallback(true);
      }
    }

    void loadRemote();
    return () => {
      active = false;
    };
  }, [persist, supabase]);

  const addTarget = useCallback(
    (input: Omit<EvangelismTarget, "id" | "createdAt" | "prayerDates" | "status">) => {
      const optimisticId = crypto.randomUUID();
      const newTarget: EvangelismTarget = {
        ...input,
        id: optimisticId,
        status: "praying",
        createdAt: new Date().toISOString(),
        prayerDates: [],
      };
      persist([newTarget, ...targets]);

      if (!useLocalFallback && userId) {
        void supabase
          .from("targets")
          .insert({
            user_id: userId,
            name: newTarget.name,
            relationship: newTarget.relationship,
            situation: newTarget.situation,
            interest: newTarget.interest,
            notes: newTarget.notes ?? null,
            status: newTarget.status,
            prayer_dates: newTarget.prayerDates,
            created_at: newTarget.createdAt,
          })
          .select(
            "id, name, relationship, situation, interest, notes, status, created_at, prayer_dates"
          )
          .single()
          .then(({ data, error }) => {
            if (error || !data) return;
            const committed = mapRowToTarget(data as TargetRow);
            setTargets((prev) =>
              prev.map((item) => (item.id === optimisticId ? committed : item))
            );
          });
      }

      return newTarget;
    },
    [persist, supabase, targets, useLocalFallback, userId]
  );

  const updateTarget = useCallback(
    (id: string, updates: Partial<EvangelismTarget>) => {
      const next = targets.map((t) => (t.id === id ? { ...t, ...updates } : t));
      persist(next);

      if (useLocalFallback || !userId) return;
      const rowUpdates = toRowUpdates(updates);
      if (Object.keys(rowUpdates).length === 0) return;

      void supabase
        .from("targets")
        .update(rowUpdates)
        .eq("id", toDbId(id))
        .eq("user_id", userId);
    },
    [persist, supabase, targets, useLocalFallback, userId]
  );

  const removeTarget = useCallback(
    (id: string) => {
      persist(targets.filter((t) => t.id !== id));

      if (useLocalFallback || !userId) return;
      void supabase.from("targets").delete().eq("id", toDbId(id)).eq("user_id", userId);
    },
    [persist, supabase, targets, useLocalFallback, userId]
  );

  const restoreTarget = useCallback(
    (target: EvangelismTarget) => {
      const exists = targets.some((t) => t.id === target.id);
      if (exists) return;
      persist([target, ...targets]);

      if (useLocalFallback || !userId) return;
      void supabase
        .from("targets")
        .insert({
          user_id: userId,
          name: target.name,
          relationship: target.relationship,
          situation: target.situation,
          interest: target.interest,
          notes: target.notes ?? null,
          status: target.status,
          prayer_dates: target.prayerDates,
          created_at: target.createdAt,
        })
        .select(
          "id, name, relationship, situation, interest, notes, status, created_at, prayer_dates"
        )
        .single()
        .then(({ data, error }) => {
          if (error || !data) return;
          const committed = mapRowToTarget(data as TargetRow);
          setTargets((prev) =>
            prev.map((item) => (item.id === target.id ? committed : item))
          );
        });
    },
    [persist, supabase, targets, useLocalFallback, userId]
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
    restoreTarget,
    updateTarget,
    removeTarget,
    updateStatus,
    prayToday,
    hasPrayedToday,
    getTarget,
  };
}

