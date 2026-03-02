"use client";

import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="flex items-center h-14 px-4">
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
      </div>
    </header>
  );
}
