import { createClient } from "@/lib/supabase/client";
import { EvangelismTarget } from "@/types/target";

type SupabaseClient = ReturnType<typeof createClient>;

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

export async function fetchTargets(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("targets")
    .select(
      "id, name, relationship, situation, interest, notes, status, created_at, prayer_dates"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return { targets: [], error };
  }

  const targets = (data as TargetRow[] | null)?.map(mapRowToTarget) ?? [];
  return { targets, error: null };
}

export async function insertTarget(
  supabase: SupabaseClient,
  userId: string,
  target: EvangelismTarget
) {
  const { data, error } = await supabase
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
    .single();

  if (error || !data) return { target: null, error };
  return { target: mapRowToTarget(data as TargetRow), error: null };
}

export async function updateTarget(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  updates: Partial<EvangelismTarget>
) {
  const rowUpdates = toRowUpdates(updates);
  if (Object.keys(rowUpdates).length === 0) return { error: null };

  const { error } = await supabase
    .from("targets")
    .update(rowUpdates)
    .eq("id", toDbId(id))
    .eq("user_id", userId);

  return { error };
}

export async function deleteTarget(
  supabase: SupabaseClient,
  userId: string,
  id: string
) {
  const { error } = await supabase
    .from("targets")
    .delete()
    .eq("id", toDbId(id))
    .eq("user_id", userId);
  return { error };
}

