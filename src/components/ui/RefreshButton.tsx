"use client";

import { useState } from "react";

interface RefreshButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function RefreshButton({ onClick, disabled }: RefreshButtonProps) {
  const [spinning, setSpinning] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    setSpinning(true);
    onClick();
    setTimeout(() => setSpinning(false), 500);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center active:bg-gray-100 transition-colors disabled:opacity-40"
      title="다른 스타일로 보기"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        className={`text-gray-500 transition-transform duration-500 ${spinning ? "rotate-[360deg]" : ""}`}
      >
        <path
          d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C14.8273 3 17.35 4.30367 19 6.34267"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M19 2V7H14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
