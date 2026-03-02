"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SplashPage() {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  const handleEnter = () => {
    setLeaving(true);
    setTimeout(() => {
      router.push("/main/targets");
    }, 300);
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center bg-white cursor-pointer transition-opacity duration-300 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
      onClick={handleEnter}
    >
      {/* Logo */}
      <div className="animate-pulse-glow flex flex-col items-center gap-6">
        <div className="w-28 h-28 rounded-3xl bg-apolo-yellow flex items-center justify-center shadow-lg">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <path d="M28 8L11 48H20L25 36H31L36 48H45L28 8Z" fill="white" />
            <path d="M26.5 30L28 21L29.5 30H26.5Z" fill="#FFD43B" />
            <path d="M28 23V28" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M25.5 25.5H30.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* App Name */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            APOLO
          </h1>
          <p className="mt-2 text-sm text-gray-400 font-medium">
            당신의 전도를 설계합니다
          </p>
        </div>
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-12 animate-fade-in">
        <p className="text-xs text-gray-300 font-medium">
          화면을 터치하여 시작하세요
        </p>
      </div>
    </div>
  );
}
