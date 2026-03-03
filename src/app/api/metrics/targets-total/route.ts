import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();

  // 1) security definer function (권장)
  const rpcRes = await supabase.rpc("get_total_targets_count");
  if (!rpcRes.error && typeof rpcRes.data === "number") {
    return NextResponse.json({ count: rpcRes.data, isGlobal: true });
  }

  // 2) fallback: 현재 유저 범위 count (RLS 정책에 따라 제한될 수 있음)
  const { count } = await supabase
    .from("targets")
    .select("*", { head: true, count: "exact" });

  return NextResponse.json({ count: count ?? 0, isGlobal: false });
}
