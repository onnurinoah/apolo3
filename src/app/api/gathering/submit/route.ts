import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const eventName =
    typeof payload.eventName === "string" ? payload.eventName.trim() : "";
  const eventDate =
    typeof payload.eventDate === "string" && payload.eventDate.trim()
      ? payload.eventDate.trim()
      : null;
  const inviteeName =
    typeof payload.inviteeName === "string" ? payload.inviteeName.trim() : "";
  const inviteCount = Number(payload.inviteCount);
  const phone =
    typeof payload.phone === "string" ? payload.phone.trim() : "";
  const prayerRequest =
    typeof payload.prayerRequest === "string"
      ? payload.prayerRequest.trim()
      : "";
  const agreedPrivacy = Boolean(payload.agreedPrivacy);

  if (!eventName) {
    return NextResponse.json({ error: "집회명을 입력해 주세요." }, { status: 400 });
  }

  if (!Number.isFinite(inviteCount) || inviteCount < 1) {
    return NextResponse.json(
      { error: "초대희망(명)을 1 이상으로 입력해 주세요." },
      { status: 400 }
    );
  }

  if (!prayerRequest) {
    return NextResponse.json({ error: "기도제목을 입력해 주세요." }, { status: 400 });
  }

  if (phone && !agreedPrivacy) {
    return NextResponse.json(
      { error: "전화번호 입력 시 개인정보 동의가 필요합니다." },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("gathering_submissions").insert({
    user_id: user.id,
    event_name: eventName,
    event_date: eventDate,
    invitee_name: inviteeName || null,
    invite_count: Math.floor(inviteCount),
    phone: phone || null,
    prayer_request: prayerRequest,
    agreed_privacy: phone ? agreedPrivacy : false,
  });

  if (error) {
    return NextResponse.json(
      {
        error:
          "등록에 실패했습니다. Supabase SQL 스키마가 적용되었는지 확인해 주세요.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

