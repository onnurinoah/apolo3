"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ONBOARDING_KEY = "apolo_onboarded";

export default function Header() {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);

  const replayIntro = () => {
    try {
      localStorage.removeItem(ONBOARDING_KEY);
    } catch {}
    setShowHelp(false);
    router.push("/main/targets");
    setTimeout(() => window.location.reload(), 50);
  };

  return (
    <>
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="flex items-center justify-between h-14 px-4">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 active:opacity-70 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-apolo-yellow flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 56 56" fill="none">
              <path d="M28 8L11 48H20L25 36H31L36 48H45L28 8Z" fill="white" />
              <path d="M26.5 30L28 21L29.5 30H26.5Z" fill="#FFD43B" />
              <path d="M28 23V28" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M25.5 25.5H30.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">
            APOLO
          </span>
        </button>

        <button
          onClick={() => setShowHelp(true)}
          className="w-8 h-8 rounded-full border border-gray-200 text-gray-500 flex items-center justify-center active:bg-gray-50"
          aria-label="사용 가이드"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
            <path d="M9.75 9.2C9.75 8.03 10.72 7 12.1 7C13.33 7 14.25 7.82 14.25 8.9C14.25 10.45 12.75 10.8 12.2 11.6C11.92 12 11.9 12.25 11.9 12.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="16.2" r="1" fill="currentColor" />
          </svg>
        </button>
      </div>
    </header>
    {showHelp && (
      <div className="fixed inset-0 z-[75] bg-black/35" onClick={() => setShowHelp(false)}>
        <div
          className="absolute inset-x-0 bottom-0 max-w-[480px] mx-auto bg-white rounded-t-3xl px-5 pt-5 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-base font-bold text-gray-900">간단 사용법</p>
          <div className="mt-3 space-y-2">
            <p className="text-sm text-gray-700">1. 내 전도에서 대상자 등록</p>
            <p className="text-sm text-gray-700">2. 전도 컨설팅으로 오늘 대화 준비</p>
            <p className="text-sm text-gray-700">3. 기도문/초대메시지 생성 후 실천</p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-blue-50 px-3 py-2 text-center">
              <p className="text-[11px] font-semibold text-blue-700">내 전도</p>
              <p className="text-[11px] text-blue-900 mt-0.5">대상자 관리</p>
            </div>
            <div className="rounded-xl bg-amber-50 px-3 py-2 text-center">
              <p className="text-[11px] font-semibold text-amber-700">전도컨설팅</p>
              <p className="text-[11px] text-amber-900 mt-0.5">대화 전략</p>
            </div>
            <div className="rounded-xl bg-purple-50 px-3 py-2 text-center">
              <p className="text-[11px] font-semibold text-purple-700">기도나눔</p>
              <p className="text-[11px] text-purple-900 mt-0.5">함께 기도</p>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={replayIntro}
              className="flex-1 py-2.5 rounded-xl bg-apolo-yellow text-gray-900 text-sm font-bold"
            >
              인트로 다시 보기
            </button>
            <button
              onClick={() => setShowHelp(false)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
