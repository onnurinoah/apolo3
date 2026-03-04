import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAuthBypassMode } from "@/lib/auth-mode";

export async function updateSession(request: NextRequest) {
  if (isAuthBypassMode()) {
    if (request.nextUrl.pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/main/targets";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 세션 갱신 (중요: getUser()를 호출해야 토큰이 리프레시됨)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 비인증 사용자가 /main/* 접근 시 → /login 리다이렉트
  if (
    !user &&
    request.nextUrl.pathname.startsWith("/main")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 인증된 사용자가 /login 접근 시 → /main/targets 리다이렉트
  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/main/targets";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
