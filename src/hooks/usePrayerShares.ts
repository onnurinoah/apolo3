"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CreatePrayerShareInput, PrayerShareItem } from "@/types/prayer-share";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "apolo_prayer_shares";

function sortShares(items: PrayerShareItem[]) {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function toDbId(id: string) {
  if (/^\d+$/.test(id)) return Number(id);
  return id;
}

function mapShareRowToItem(
  row: {
    id: string | number;
    title: string;
    request: string;
    author_name: string | null;
    is_anonymous: boolean;
    created_at: string;
  },
  prayedCount: number,
  prayedByMe: boolean
): PrayerShareItem {
  return {
    id: String(row.id),
    title: row.title,
    request: row.request,
    authorName: row.author_name ?? "",
    isAnonymous: row.is_anonymous,
    createdAt: row.created_at,
    prayedCount,
    prayedByMe,
  };
}

export function usePrayerShares() {
  const [shares, setShares] = useState<PrayerShareItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [useLocalFallback, setUseLocalFallback] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const loadLocal = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setShares(sortShares(JSON.parse(raw)));
      } else {
        setShares([]);
      }
    } catch {
      setShares([]);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active) return;
        setUserId(user?.id ?? null);

        if (!user) {
          setUseLocalFallback(true);
          loadLocal();
          setHydrated(true);
          return;
        }

        const sharesRes = await supabase
          .from("prayer_shares")
          .select("id, title, request, author_name, is_anonymous, created_at")
          .order("created_at", { ascending: false })
          .limit(120);

        if (sharesRes.error) {
          setUseLocalFallback(true);
          loadLocal();
          setHydrated(true);
          return;
        }

        const rows = sharesRes.data ?? [];
        const shareIds = rows.map((row) => row.id);
        const countMap = new Map<string, number>();
        const prayedByMeSet = new Set<string>();

        if (shareIds.length > 0) {
          const prayersRes = await supabase
            .from("prayer_share_prayers")
            .select("share_id, user_id")
            .in("share_id", shareIds);

          if (!prayersRes.error && prayersRes.data) {
            prayersRes.data.forEach((prayedRow) => {
              const id = String(prayedRow.share_id);
              countMap.set(id, (countMap.get(id) ?? 0) + 1);
              if (prayedRow.user_id === user.id) {
                prayedByMeSet.add(id);
              }
            });
          }
        }

        const mapped = rows.map((row) =>
          mapShareRowToItem(
            row,
            countMap.get(String(row.id)) ?? 0,
            prayedByMeSet.has(String(row.id))
          )
        );

        setUseLocalFallback(false);
        setShares(sortShares(mapped));
      } catch {
        setUseLocalFallback(true);
        loadLocal();
      } finally {
        if (active) setHydrated(true);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [loadLocal, supabase]);

  const persist = useCallback((next: PrayerShareItem[]) => {
    const sorted = sortShares(next);
    setShares(sorted);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    } catch { /* localStorage full */ }
  }, []);

  const addShare = useCallback(
    (input: CreatePrayerShareInput) => {
      if (useLocalFallback || !userId) {
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
      }

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

      setShares((prev) => sortShares([item, ...prev]));

      void supabase
        .from("prayer_shares")
        .insert({
          user_id: userId,
          title: item.title,
          request: item.request,
          author_name: item.authorName || null,
          is_anonymous: item.isAnonymous,
        })
        .select("id, title, request, author_name, is_anonymous, created_at")
        .single()
        .then(({ data, error }) => {
          if (error || !data) {
            persist([item, ...shares]);
            return;
          }
          const committed = mapShareRowToItem(data, 0, false);
          setShares((prev) =>
            sortShares(prev.map((s) => (s.id === item.id ? committed : s)))
          );
        });

      return item;
    },
    [persist, shares, supabase, useLocalFallback, userId]
  );

  const togglePrayed = useCallback(
    (id: string) => {
      if (useLocalFallback || !userId) {
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
        return;
      }

      const current = shares.find((item) => item.id === id);
      if (!current) return;

      const dbId = toDbId(id);
      const nextPrayedByMe = !current.prayedByMe;

      setShares((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          return {
            ...item,
            prayedByMe: nextPrayedByMe,
            prayedCount: Math.max(
              0,
              item.prayedCount + (nextPrayedByMe ? 1 : -1)
            ),
          };
        })
      );

      const query = nextPrayedByMe
        ? supabase.from("prayer_share_prayers").insert({
            share_id: dbId,
            user_id: userId,
          })
        : supabase
            .from("prayer_share_prayers")
            .delete()
            .eq("share_id", dbId)
            .eq("user_id", userId);

      void query.then(({ error }) => {
        if (error) {
          setShares((prev) =>
            prev.map((item) => {
              if (item.id !== id) return item;
              return {
                ...item,
                prayedByMe: current.prayedByMe,
                prayedCount: current.prayedCount,
              };
            })
          );
        }
      });
    },
    [persist, shares, supabase, useLocalFallback, userId]
  );

  const removeShare = useCallback(
    (id: string) => {
      if (useLocalFallback || !userId) {
        persist(shares.filter((item) => item.id !== id));
        return;
      }

      const prev = shares;
      setShares((curr) => curr.filter((item) => item.id !== id));

      void supabase
        .from("prayer_shares")
        .delete()
        .eq("id", toDbId(id))
        .then(({ error }) => {
          if (error) setShares(prev);
        });
    },
    [persist, shares, supabase, useLocalFallback, userId]
  );

  return { shares, hydrated, addShare, togglePrayed, removeShare };
}
