"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isAuthBypassMode } from "@/lib/auth-mode";

const ONBOARDING_SLIDES = [
  {
    icon: (
      <div className="w-20 h-20 rounded-2xl bg-apolo-yellow flex items-center justify-center shadow-lg">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L3 7V12C3 17.55 6.84 22.74 12 24C17.16 22.74 21 17.55 21 12V7L12 2Z"
            fill="white"
            stroke="white"
            strokeWidth="1"
          />
          <path d="M9 12H15M12 9V15" stroke="#FFD43B" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    ),
    title: "APOLO에 오신 것을 환영합니다",
    desc: "기도와 관계 중심의 전도 여정을\n함께 설계하는 동행 앱입니다.",
  },
  {
    icon: (
      <div className="w-20 h-20 rounded-full bg-apolo-yellow-light flex items-center justify-center">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke="#F59F00" strokeWidth="1.5" />
          <path d="M5 20C5 16.134 8.134 13 12 13C15.866 13 19 16.134 19 20" stroke="#F59F00" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 17L13.5 15.5L12 14L10.5 15.5L12 17Z" fill="#F59F00" stroke="#F59F00" strokeWidth="0.5" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    title: "전도 대상자를 관리하세요",
    desc: "이름과 상황을 기록하면\n맞춤 전도 전략, 기도문, 초대 메시지를\n한곳에서 관리할 수 있어요.",
  },
  {
    icon: (
      <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L3 7V12C3 17.55 6.84 22.74 12 24C17.16 22.74 21 17.55 21 12V7L12 2Z" fill="none" stroke="#3B82F6" strokeWidth="1.5" />
          <path d="M9 12H15M12 9V15" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    ),
    title: "질문에 차분하게 답해요",
    desc: "자주 묻는 질문 아카이브를 먼저 보고\n필요할 때 AI 설명으로 보완할 수 있어요.",
  },
  {
    icon: (
      <div className="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path d="M12 3V9" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M9 6H15" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 21H16" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M10 21V18C10 16.9 10.9 16 12 16C13.1 16 14 16.9 14 18V21" stroke="#A855F7" strokeWidth="1.5" />
          <path d="M7 12C7 10.3 8.3 9 10 9H14C15.7 9 17 10.3 17 12V14.5C17 15.9 15.9 17 14.5 17H9.5C8.1 17 7 15.9 7 14.5V12Z" stroke="#A855F7" strokeWidth="1.5" />
        </svg>
      </div>
    ),
    title: "맞춤 기도문 생성",
    desc: "대상자의 상황에 맞는\n진심 어린 기도문을 만들어드립니다.\n구원, 건강, 가정 등 다양한 주제를 선택하세요.",
  },
  {
    icon: (
      <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path d="M12 21C12 21 4.5 16 4.5 10C4.5 7.5 6.5 5.5 9 5.5C10.5 5.5 11.5 6.2 12 7.2C12.5 6.2 13.5 5.5 15 5.5C17.5 5.5 19.5 7.5 19.5 10C19.5 16 12 21 12 21Z" stroke="#16A34A" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M8.5 12H11M13 12H15.5" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    ),
    title: "기도 나눔으로 함께 기도해요",
    desc: "나의 기도문을 공유하면\n다른 성도들이 '함께 기도합니다'로\n응원합니다. 이름은 안전하게 익명 처리돼요.",
  },
  {
    icon: (
      <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path d="M8 18H17C19.2 18 21 16.2 21 14C21 11.8 19.2 10 17 10H16.7C16.1 7.7 14.1 6 11.7 6C8.9 6 6.7 8.2 6.7 11V11.3C5.1 11.8 4 13.3 4 15C4 16.7 5.3 18 7 18H8Z" stroke="#D97706" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M12 10V16M9.5 13.5H14.5" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    ),
    title: "안전한 클라우드 저장",
    desc: "Google 로그인으로\n기도 기록과 전도 대상자 정보가\n안전하게 저장됩니다.",
  },
];

export default function LoginPage() {
  const bypassAuth = isAuthBypassMode();
  const [slideIndex, setSlideIndex] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isLastSlide = slideIndex === ONBOARDING_SLIDES.length - 1;
  const slide = ONBOARDING_SLIDES[slideIndex];

  const handleNext = () => {
    if (isLastSlide) {
      setShowLogin(true);
    } else {
      setSlideIndex((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    setShowLogin(true);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } catch {
      setIsLoading(false);
    }
  };

  const handleDevStart = () => {
    window.location.href = "/main/targets";
  };

  // 로그인 화면
  if (showLogin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
        <div className="w-full max-w-[480px] mx-auto text-center">
          {/* 로고 */}
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-apolo-yellow flex items-center justify-center shadow-lg">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L3 7V12C3 17.55 6.84 22.74 12 24C17.16 22.74 21 17.55 21 12V7L12 2Z"
                fill="white"
                stroke="white"
                strokeWidth="1"
              />
              <path d="M9 12H15M12 9V15" stroke="#FFD43B" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">APOLO</h1>
          <p className="text-sm text-gray-400 mb-10">기독교 전도 도우미</p>

          {bypassAuth ? (
            <button
              onClick={handleDevStart}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-apolo-yellow rounded-2xl text-sm font-bold text-gray-900 active:bg-apolo-yellow-dark transition-all"
            >
              개발 모드로 바로 시작
            </button>
          ) : (
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-200 rounded-2xl text-sm font-semibold text-gray-700 hover:border-gray-300 active:bg-gray-50 transition-all disabled:opacity-50"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {isLoading ? "로그인 중..." : "Google로 시작하기"}
            </button>
          )}

          <p className="text-xs text-gray-300 mt-6 leading-relaxed">
            {bypassAuth
              ? "개발 모드에서는 로그인 없이 로컬 데이터로 동작합니다"
              : "로그인하면 기도 기록이 안전하게 저장됩니다"}
          </p>
        </div>
      </div>
    );
  }

  // 온보딩 슬라이드
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="w-full max-w-[480px] mx-auto flex-1 flex flex-col">
        {/* 상단 진행 바 */}
        <div className="px-6 pt-6">
          <div className="flex gap-1.5">
            {ONBOARDING_SLIDES.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full flex-1 transition-all duration-300 ${
                  i <= slideIndex ? "bg-apolo-yellow" : "bg-gray-100"
                }`}
              />
            ))}
          </div>
        </div>

        {/* 건너뛰기 */}
        <div className="px-6 pt-3 flex justify-end">
          <button
            onClick={handleSkip}
            className="text-xs text-gray-400 px-3 py-1"
          >
            건너뛰기
          </button>
        </div>

        {/* 슬라이드 콘텐츠 */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center animate-fade-in">
          <div className="mb-6">{slide.icon}</div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{slide.title}</h2>
          <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">
            {slide.desc}
          </p>
        </div>

        {/* 하단 버튼 */}
        <div className="px-6 pb-8">
          <button
            onClick={handleNext}
            className="w-full py-4 rounded-2xl bg-apolo-yellow text-gray-900 font-bold text-sm active:bg-apolo-yellow-dark transition-colors"
          >
            {isLastSlide ? "시작하기" : "다음"}
          </button>
        </div>
      </div>
    </div>
  );
}
