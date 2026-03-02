"use client";

export default function ShareButton({ text }: { text: string }) {
  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ text }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(text).catch(() => {});
      alert("클립보드에 복사되었습니다.");
    }
  };
  return (
    <button
      onClick={handleShare}
      className="h-10 px-4 rounded-full bg-gray-50 flex items-center gap-1.5 active:bg-gray-100 transition-colors text-sm font-medium text-gray-500"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7M12 3v13M8 7l4-4 4 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>공유</span>
    </button>
  );
}
