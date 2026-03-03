import { createClient } from "@/lib/supabase/client";
import { CreatePrayerShareInput, PrayerShareItem } from "@/types/prayer-share";

type SupabaseClient = ReturnType<typeof createClient>;

type PrayerShareRow = {
  id: string | number;
  title: string;
  request: string;
  author_name: string | null;
  is_anonymous: boolean;
  created_at: string;
};

function toDbId(id: string) {
  if (/^\d+$/.test(id)) return Number(id);
  return id;
}

function mapShareRowToItem(
  row: PrayerShareRow,
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

export async function fetchPrayerShareFeed(
  supabase: SupabaseClient,
  userId: string
) {
  const sharesRes = await supabase
    .from("prayer_shares")
    .select("id, title, request, author_name, is_anonymous, created_at")
    .order("created_at", { ascending: false })
    .limit(120);

  if (sharesRes.error) {
    return { items: [] as PrayerShareItem[], error: sharesRes.error };
  }

  const rows = (sharesRes.data ?? []) as PrayerShareRow[];
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
        if (prayedRow.user_id === userId) {
          prayedByMeSet.add(id);
        }
      });
    }
  }

  const items = rows.map((row) =>
    mapShareRowToItem(
      row,
      countMap.get(String(row.id)) ?? 0,
      prayedByMeSet.has(String(row.id))
    )
  );
  return { items, error: null };
}

export async function insertPrayerShare(
  supabase: SupabaseClient,
  userId: string,
  input: CreatePrayerShareInput
) {
  const { data, error } = await supabase
    .from("prayer_shares")
    .insert({
      user_id: userId,
      title: input.title.trim(),
      request: input.request.trim(),
      author_name: input.authorName?.trim() || null,
      is_anonymous: input.isAnonymous ?? true,
    })
    .select("id, title, request, author_name, is_anonymous, created_at")
    .single();

  if (error || !data) {
    return { item: null, error };
  }

  return {
    item: mapShareRowToItem(data as PrayerShareRow, 0, false),
    error: null,
  };
}

export async function setPrayerSharePrayed(
  supabase: SupabaseClient,
  shareId: string,
  userId: string,
  prayed: boolean
) {
  const query = prayed
    ? supabase.from("prayer_share_prayers").insert({
        share_id: toDbId(shareId),
        user_id: userId,
      })
    : supabase
        .from("prayer_share_prayers")
        .delete()
        .eq("share_id", toDbId(shareId))
        .eq("user_id", userId);

  const { error } = await query;
  return { error };
}

export async function deletePrayerShare(
  supabase: SupabaseClient,
  shareId: string
) {
  const { error } = await supabase
    .from("prayer_shares")
    .delete()
    .eq("id", toDbId(shareId));
  return { error };
}

