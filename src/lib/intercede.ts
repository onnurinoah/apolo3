"use client";

export const INTERCEDE_COUNT_KEY = "apolo_intercede_count";
const INTERCEDE_DAILY_KEY_PREFIX = "apolo_intercede_daily";
const INTERCEDE_TOTAL_BY_TARGET_KEY = "apolo_intercede_total_by_target";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dailyKey(dateKey: string) {
  return `${INTERCEDE_DAILY_KEY_PREFIX}_${dateKey}`;
}

export function readDailyInterceded(dateKey: string = getLocalDateKey()): string[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParse<unknown[]>(localStorage.getItem(dailyKey(dateKey)), []);
  return parsed.filter((v): v is string => typeof v === "string");
}

export function writeDailyInterceded(ids: string[], dateKey: string = getLocalDateKey()) {
  if (typeof window === "undefined") return;
  localStorage.setItem(dailyKey(dateKey), JSON.stringify(ids));
}

export function readTargetIntercedeTotals(): Record<string, number> {
  if (typeof window === "undefined") return {};
  const parsed = safeParse<Record<string, unknown>>(
    localStorage.getItem(INTERCEDE_TOTAL_BY_TARGET_KEY),
    {}
  );
  const result: Record<string, number> = {};
  for (const [k, v] of Object.entries(parsed)) {
    const n = Number(v);
    result[k] = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  }
  return result;
}

export function writeTargetIntercedeTotals(totals: Record<string, number>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(INTERCEDE_TOTAL_BY_TARGET_KEY, JSON.stringify(totals));
}

export function incrementTargetIntercedeTotal(targetId: string): number {
  const totals = readTargetIntercedeTotals();
  const next = (totals[targetId] || 0) + 1;
  totals[targetId] = next;
  writeTargetIntercedeTotals(totals);
  return next;
}

export function getTargetIntercedeTotal(targetId: string): number {
  const totals = readTargetIntercedeTotals();
  return totals[targetId] || 0;
}

