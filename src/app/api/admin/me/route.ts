import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = await isAdminUser(supabase, user?.email ?? null);

  return NextResponse.json({
    isAdmin,
  });
}
