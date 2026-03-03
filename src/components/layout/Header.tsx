"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ONBOARDING_KEY = "apolo_onboarded";

export default function Header() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [nickname, setNickname] = useState("");
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);
  const [nicknameError, setNicknameError] = useState("");

  useEffect(() => {
    function getNickname(user: { user_metadata?: Record<string, unknown> } | null) {
      const value = user?.user_metadata?.nickname;
      return typeof value === "string" ? value.trim() : "";
    }

    let active = true;
    async function boot() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active || !user) return;

      const nextNickname = getNickname(user);
      if (nextNickname) {
        setNickname(nextNickname);
      } else {
        setShowNicknameModal(true);
      }
    }
    void boot();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextNickname = getNickname(session?.user ?? null);
      setNickname(nextNickname);
      setShowNicknameModal(Boolean(session?.user && !nextNickname));
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const replayIntro = () => {
    try {
      localStorage.removeItem(ONBOARDING_KEY);
    } catch {}
    window.location.href = "/main/targets";
  };

  const saveNickname = async () => {
    const trimmed = nicknameInput.trim();
    if (!trimmed) {
      setNicknameError("닉네임을 입력해 주세요.");
      return;
    }

    setSavingNickname(true);
    setNicknameError("");
    const { data, error } = await supabase.auth.updateUser({
      data: { nickname: trimmed },
    });
    setSavingNickname(false);

    if (error) {
      setNicknameError("저장에 실패했어요. 다시 시도해 주세요.");
      return;
    }

    const saved =
      typeof data.user?.user_metadata?.nickname === "string"
        ? data.user.user_metadata.nickname.trim()
        : trimmed;
    setNickname(saved);
    setNicknameInput("");
    setShowNicknameModal(false);
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

          <div className="flex items-center gap-2">
            {nickname && (
              <span className="h-8 px-3 rounded-full bg-apolo-yellow-light text-apolo-yellow-dark text-xs font-bold inline-flex items-center">
                {nickname}
              </span>
            )}
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
        </div>
      </header>

      {showNicknameModal && (
        <div className="fixed inset-0 z-[80] bg-black/35 backdrop-blur-[1px] flex items-center justify-center px-5">
          <div className="w-full max-w-[360px] rounded-2xl bg-white border border-gray-100 shadow-xl p-5">
            <h3 className="text-base font-bold text-gray-900">닉네임을 정해 주세요</h3>
            <p className="mt-1 text-xs text-gray-500">첫 설정 후 우측 상단에 표시됩니다.</p>
            <input
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              placeholder="예: 소망이, 요셉"
              className="mt-3 w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-apolo-yellow"
            />
            {nicknameError && <p className="mt-2 text-xs text-red-500">{nicknameError}</p>}
            <button
              onClick={() => void saveNickname()}
              disabled={savingNickname}
              className="mt-3 w-full py-2.5 rounded-xl bg-apolo-yellow text-gray-900 text-sm font-bold disabled:opacity-50"
            >
              {savingNickname ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
