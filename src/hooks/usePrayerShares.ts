"use client";

import { useCallback, useEffect, useState } from "react";
import { CreatePrayerShareInput, PrayerShareItem } from "@/types/prayer-share";

const STORAGE_KEY = "apolo_prayer_shares";

function sortShares(items: PrayerShareItem[]) {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function usePrayerShares() {
  const [shares, setShares] = useState<PrayerShareItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setShares(sortShares(JSON.parse(raw)));
      }
    } catch {
      setShares([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  const persist = useCallback((next: PrayerShareItem[]) => {
    const sorted = sortShares(next);
    setShares(sorted);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    } catch { /* localStorage full */ }
  }, []);

  const addShare = useCallback(
    (input: CreatePrayerShareInput) => {
      const item: PrayerShareItem = {
        id: crypto.randomUUID(),
        title: input.title.trim(),
        request: input.request.trim(),
        authorName: input.authorName?.trim() || "",
        isAnonymous: input.isAnonymous ?? true,
        targetName: input.targetName?.trim() || "",
        topic: input.topic,
        createdAt: new Date().toISOString(),
        prayedCount: 0,
        prayedByMe: false,
      };
      persist([item, ...shares]);
      return item;
    },
    [persist, shares]
  );

  const togglePrayed = useCallback(
    (id: string) => {
      persist(
        shares.map((item) => {
          if (item.id !== id) return item;
          const prayedByMe = !item.prayedByMe;
          return {
            ...item,
            prayedByMe,
            prayedCount: Math.max(0, item.prayedCount + (prayedByMe ? 1 : -1)),
          };
        })
      );
    },
    [persist, shares]
  );

  const removeShare = useCallback(
    (id: string) => {
      persist(shares.filter((item) => item.id !== id));
    },
    [persist, shares]
  );

  return { shares, hydrated, addShare, togglePrayed, removeShare };
}
