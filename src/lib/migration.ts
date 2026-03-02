import { createClient } from "@/lib/supabase/client";

/**
 * 최초 로그인 시 localStorage 데이터를 Supabase로 1회 이관
 */
export async function migrateLocalStorageToSupabase(userId: string) {
  const MIGRATION_KEY = "apolo_migrated";

  // 이미 마이그레이션 완료
  if (localStorage.getItem(MIGRATION_KEY)) return;

  const supabase = createClient();

  try {
    // ── targets 마이그레이션 ────────────────────────
    const rawTargets = localStorage.getItem("apolo_targets");
    if (rawTargets) {
      const targets = JSON.parse(rawTargets);
      if (targets.length > 0) {
        // DB에 이미 데이터가 있는지 확인 (중복 방지)
        const { count } = await supabase
          .from("targets")
          .select("*", { count: "exact", head: true });

        if (count === 0) {
          const rows = targets.map((t: Record<string, unknown>) => ({
            user_id: userId,
            name: t.name,
            relationship: t.relationship,
            situation: t.situation,
            interest: t.interest,
            notes: t.notes || null,
            status: t.status || "praying",
            prayer_dates: t.prayerDates || [],
            created_at: t.createdAt || new Date().toISOString(),
          }));
          await supabase.from("targets").insert(rows);
        }
      }
    }

    // ── favorites 마이그레이션 ────────────────────────
    const rawFavorites = localStorage.getItem("apolo_favorites");
    if (rawFavorites) {
      const favorites = JSON.parse(rawFavorites);
      if (favorites.length > 0) {
        const { count } = await supabase
          .from("favorites")
          .select("*", { count: "exact", head: true });

        if (count === 0) {
          const rows = favorites.map((f: Record<string, unknown>) => ({
            user_id: userId,
            question_id: f.id,
            category_id: f.categoryId,
            question_text: f.question,
            saved_at: f.savedAt,
          }));
          await supabase.from("favorites").insert(rows);
        }
      }
    }

    localStorage.setItem(MIGRATION_KEY, "1");
  } catch (err) {
    console.error("Migration failed:", err);
    // 실패해도 앱 사용에는 지장 없음 — 다음 로그인 시 재시도
  }
}
