import { NextResponse, type NextRequest } from "next/server";

export async function middleware(_request: NextRequest) {
  // TODO: 로그인 기능 활성화 시 Supabase 세션 체크로 교체
  // import { updateSession } from "@/lib/supabase/middleware";
  // return await updateSession(request);
  return NextResponse.next();
}

export const config = {
  matcher: ["/main/:path*"],
};
