import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin";

type GatheringConfig = {
  isOpen: boolean;
  eventName: string;
  eventDate: string | null;
};

const DEFAULT_CONFIG: GatheringConfig = {
  isOpen: false,
  eventName: "",
  eventDate: null,
};

export async function GET() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("gathering_config")
    .select("is_open, event_name, event_date")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    return NextResponse.json(DEFAULT_CONFIG);
  }

  if (!data) {
    return NextResponse.json(DEFAULT_CONFIG);
  }

  return NextResponse.json({
    isOpen: Boolean(data.is_open),
    eventName: data.event_name ?? "",
    eventDate: data.event_date ?? null,
  });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isAdminUser(supabase, user.email ?? null))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const eventName =
    typeof body.eventName === "string" ? body.eventName.trim() : "";
  const eventDate =
    typeof body.eventDate === "string" && body.eventDate.trim()
      ? body.eventDate.trim()
      : null;
  const isOpen = Boolean(body.isOpen);

  if (isOpen && !eventName) {
    return NextResponse.json(
      { error: "집회명을 입력해 주세요." },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("gathering_config").upsert(
    {
      id: 1,
      is_open: isOpen,
      event_name: eventName,
      event_date: eventDate,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    return NextResponse.json(
      {
        error:
          "설정 저장에 실패했습니다. Supabase SQL 스키마가 적용되었는지 확인해 주세요.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    isOpen,
    eventName,
    eventDate,
  } satisfies GatheringConfig);
}
