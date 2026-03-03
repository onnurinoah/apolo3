"use client";

import { useState, useEffect } from "react";

const ONBOARDING_KEY = "apolo_onboarded";

const slides = [
  {
    icon: (
      <div className="w-20 h-20 rounded-2xl bg-apolo-yellow flex items-center justify-center shadow-lg">
        <svg width="40" height="40" viewBox="0 0 56 56" fill="none">
          <path d="M28 8L11 48H20L25 36H31L36 48H45L28 8Z" fill="white" />
          <path d="M26.5 30L28 21L29.5 30H26.5Z" fill="#FFD43B" />
          <path d="M28 23V28" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <path d="M25.5 25.5H30.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    ),
    title: "APOLO에 오신 것을 환영합니다",
    desc: "당신의 전도를 설계하는\nAI 전도 여정 파트너입니다.",
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
    desc: "이름과 상황을 기록하면 맞춤 전략,\n기도문, 초대 메시지를 한곳에서\n만들고 관리할 수 있어요.",
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
    title: "질문에 바로 답변 검색",
    desc: "270개+ 질문 DB를 우선 검색하고\n필요할 때만 AI로 보완합니다.\n음성으로도 질문할 수 있어요.",
  },
  {
    icon: (
      <div className="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path d="M12 3C12 3 8 7 8 11V15L6 17V19H18V17L16 15V11C16 7 12 3 12 3Z" stroke="#A855F7" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M12 7V11M10 9H14" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M10 19V20.5C10 21.33 10.67 22 11.5 22H12.5C13.33 22 14 21.33 14 20.5V19" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    ),
    title: "맞춤 기도문 생성",
    desc: "대상자의 상황에 맞는\n진심 어린 기도문을 만들어드립니다.\n구원, 건강, 가정 등 다양한 주제로.",
  },
  {
    icon: (
      <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path d="M12 21C12 21 4 15 4 9.5C4 7 6 5 8.5 5C10 5 11.5 6 12 7C12.5 6 14 5 15.5 5C18 5 20 7 20 9.5C20 15 12 21 12 21Z" stroke="#22C55E" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="8" cy="4" r="2" stroke="#22C55E" strokeWidth="1.2" />
          <circle cx="16" cy="4" r="2" stroke="#22C55E" strokeWidth="1.2" />
        </svg>
      </div>
    ),
    title: "함께 기도해요",
    desc: "기도 제목을 나누면 다른 성도들이\n'함께 기도합니다'로 응원합니다.\n이름은 안전하게 익명 처리돼요.",
  },
];

interface OnboardingProps {
  onDone: () => void;
}

export default function Onboarding({ onDone }: OnboardingProps) {
  const [current, setCurrent] = useState(0);
  const isLast = current === slides.length - 1;

  const handleDone = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, "1");
    } catch {}
    onDone();
  };

  return (
    <div className="fixed inset-0 bg-white z-[70] flex flex-col max-w-[480px] mx-auto">
      {/* 진행 바 */}
      <div className="px-6 pt-6">
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full flex-1 transition-all duration-300 ${
                i <= current ? "bg-apolo-yellow" : "bg-gray-100"
              }`}
            />
          ))}
        </div>
      </div>

      {/* 건너뛰기 */}
      <div className="flex justify-end px-6 pt-3">
        <button
          onClick={handleDone}
          className="text-xs text-gray-400 px-3 py-1"
        >
          건너뛰기
        </button>
      </div>

      {/* 슬라이드 콘텐츠 */}
      <div
        key={current}
        className="flex-1 flex flex-col items-center justify-center px-8 text-center animate-fade-in"
      >
        <div className="mb-6">{slides[current].icon}</div>
        <h2 className="text-xl font-bold text-gray-900 mb-3">
          {slides[current].title}
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">
          {slides[current].desc}
        </p>
      </div>

      {/* 하단 버튼 */}
      <div className="px-6 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <button
          onClick={() => (isLast ? handleDone() : setCurrent(current + 1))}
          className="w-full py-4 rounded-2xl bg-apolo-yellow text-gray-900 font-bold text-sm active:bg-apolo-yellow-dark transition-colors"
        >
          {isLast ? "시작하기" : "다음"}
        </button>
      </div>
    </div>
  );
}

export function useOnboarding() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const done = localStorage.getItem(ONBOARDING_KEY);
      if (!done) setShow(true);
    } catch {}
  }, []);

  return { show, done: () => setShow(false) };
}
