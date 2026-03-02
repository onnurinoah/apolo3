"use client";

import { useRouter } from "next/navigation";

const ONBOARDING_KEY = "apolo_onboarded";

export default function Header() {
  const router = useRouter();

  const replayIntro = () => {
    try {
      localStorage.removeItem(ONBOARDING_KEY);
    } catch {}
    window.location.href = "/main/targets";
  };

  return (
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
          onClick={replayIntro}
          className="h-8 px-2.5 rounded-full border border-gray-200 text-gray-600 flex items-center gap-1.5 active:bg-gray-50"
          aria-label="인트로 다시 보기"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
            <path d="M9.75 9.2C9.75 8.03 10.72 7 12.1 7C13.33 7 14.25 7.82 14.25 8.9C14.25 10.45 12.75 10.8 12.2 11.6C11.92 12 11.9 12.25 11.9 12.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="16.2" r="1" fill="currentColor" />
          </svg>
          <span className="text-[11px] font-semibold">인트로</span>
        </button>
      </div>
    </header>
  );
}
