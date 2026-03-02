"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/main/targets",
    label: "내 전도",
    icon: (active: boolean) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="transition-colors"
      >
        <circle
          cx="12"
          cy="8"
          r="4"
          fill={active ? "#FFD43B" : "none"}
          stroke={active ? "#FFD43B" : "#9CA3AF"}
          strokeWidth="1.5"
        />
        <path
          d="M5 20C5 16.134 8.134 13 12 13C15.866 13 19 16.134 19 20"
          stroke={active ? "#FFD43B" : "#9CA3AF"}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M12 17L13.5 15.5L12 14L10.5 15.5L12 17Z"
          fill={active ? "white" : "#9CA3AF"}
          stroke={active ? "white" : "#9CA3AF"}
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/main/apologetics",
    label: "변증답변",
    icon: (active: boolean) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="transition-colors"
      >
        <path
          d="M12 2L3 7V12C3 17.55 6.84 22.74 12 24C17.16 22.74 21 17.55 21 12V7L12 2Z"
          fill={active ? "#FFD43B" : "none"}
          stroke={active ? "#FFD43B" : "#9CA3AF"}
          strokeWidth="1.5"
        />
        <path
          d="M9 12H15M12 9V15"
          stroke={active ? "white" : "#9CA3AF"}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/main/community",
    label: "기도나눔",
    icon: (active: boolean) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="transition-colors"
      >
        <circle
          cx="9"
          cy="7"
          r="3"
          fill={active ? "#FFD43B" : "none"}
          stroke={active ? "#FFD43B" : "#9CA3AF"}
          strokeWidth="1.5"
        />
        <path
          d="M3 18C3 14.686 5.686 12 9 12C12.314 12 15 14.686 15 18"
          stroke={active ? "#FFD43B" : "#9CA3AF"}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle
          cx="17"
          cy="7"
          r="2.5"
          fill={active ? "#FFD43B" : "none"}
          stroke={active ? "#FFD43B" : "#9CA3AF"}
          strokeWidth="1.5"
        />
        <path
          d="M17 12C19.21 12 21 13.79 21 16"
          stroke={active ? "#FFD43B" : "#9CA3AF"}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-[480px] mx-auto bg-white/95 backdrop-blur border-t border-gray-100 shadow-[0_-4px_16px_rgba(17,24,39,0.06)]">
        <div className="flex pb-[env(safe-area-inset-bottom)]">
          {tabs.map((tab) => {
            const active = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 min-h-[64px] py-2.5 transition-colors ${
                  active ? "text-apolo-yellow-dark" : "text-gray-400"
                }`}
              >
                {tab.icon(active)}
                <span
                  className={`text-xs font-medium ${
                    active ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
