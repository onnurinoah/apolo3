"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePrayerShares } from "@/hooks/usePrayerShares";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR");
}

export default function CommunityPage() {
  const router = useRouter();
  const { shares, hydrated, addShare, togglePrayed, removeShare } =
    usePrayerShares();
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    request: "",
    authorName: "",
    isAnonymous: true,
  });

  const canSubmit = form.title.trim() && form.request.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;
    addShare({
      title: form.title,
      request: form.request,
      authorName: form.authorName,
      isAnonymous: form.isAnonymous,
    });
    setForm({ title: "", request: "", authorName: "", isAnonymous: true });
    setShowForm(false);
  };

  return (
    <div className="px-4 py-4 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-500"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 19L8 12L15 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">기도 나눔</h1>
          <p className="text-sm text-gray-400">
            서로의 기도 제목을 나누고 함께 기도해요
          </p>
        </div>
      </div>

      {/* 새 기도제목 작성 버튼 / 폼 */}
      {showForm ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-card space-y-3 animate-fade-in-up">
          <p className="text-sm font-bold text-gray-900">기도제목 나누기</p>

          <input
            value={form.title}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="제목 (예: 소중한 분의 구원을 위해)"
            className="w-full rounded-xl bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-apolo-yellow"
          />

          <textarea
            value={form.request}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, request: e.target.value }))
            }
            placeholder="함께 기도받고 싶은 내용을 적어주세요."
            className="min-h-[100px] w-full rounded-xl bg-gray-50 px-4 py-3 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-apolo-yellow"
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-500">
              <input
                type="checkbox"
                checked={form.isAnonymous}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    isAnonymous: e.target.checked,
                  }))
                }
                className="rounded border-gray-300"
              />
              익명으로 나누기
            </label>

            {!form.isAnonymous && (
              <input
                value={form.authorName}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    authorName: e.target.value,
                  }))
                }
                placeholder="이름"
                className="w-24 rounded-lg bg-gray-50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-apolo-yellow"
              />
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-500"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 rounded-xl bg-apolo-yellow py-3 text-sm font-bold text-gray-900 disabled:opacity-40"
            >
              올리기
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-2xl border-2 border-dashed border-apolo-yellow/40 py-4 text-sm font-semibold text-apolo-yellow-dark active:bg-apolo-yellow-light/30 transition-colors"
        >
          + 기도제목 나누기
        </button>
      )}

      {/* 기도 나눔 리스트 */}
      {!hydrated ? (
        <div className="rounded-2xl bg-white p-6 text-center text-sm text-gray-400 border border-gray-100">
          불러오는 중...
        </div>
      ) : shares.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-50 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2C12 2 8 6 8 10V14L6 16V18H18V16L16 14V10C16 6 12 2 12 2Z" stroke="#9CA3AF" strokeWidth="1.5" strokeLinejoin="round" /><path d="M12 6V10M10 8H14" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </div>
          <p className="font-semibold text-gray-900">
            아직 나눔된 기도제목이 없어요
          </p>
          <p className="mt-1 text-sm text-gray-400">
            첫 기도제목을 올려 함께 기도하는 흐름을 만들어보세요.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {shares.map((item) => {
            const isExpanded = expandedId === item.id;
            const isLong = item.request.length > 100;

            return (
              <article
                key={item.id}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-card"
              >
                {/* 제목 + 기도 수 */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-[15px]">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-400">
                      {item.isAnonymous
                        ? "익명의 성도"
                        : item.authorName || "이름 미입력"}{" "}
                      · {timeAgo(item.createdAt)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-apolo-yellow-light px-2.5 py-1 text-sm font-semibold text-gray-700 inline-flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2C12 2 8 6 8 10V14L6 16V18H18V16L16 14V10C16 6 12 2 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M12 6V10M10 8H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                    {item.prayedCount}
                  </span>
                </div>

                {/* 기도 내용 */}
                <p
                  className={`mt-3 text-sm leading-relaxed text-gray-600 whitespace-pre-wrap ${
                    !isExpanded && isLong ? "line-clamp-3" : ""
                  }`}
                >
                  {item.request}
                </p>
                {isLong && !isExpanded && (
                  <button
                    onClick={() => setExpandedId(item.id)}
                    className="mt-1 text-sm text-apolo-yellow-dark font-medium"
                  >
                    더보기
                  </button>
                )}
                {isExpanded && isLong && (
                  <button
                    onClick={() => setExpandedId(null)}
                    className="mt-1 text-sm text-gray-400 font-medium"
                  >
                    접기
                  </button>
                )}

                {/* 하단 액션 */}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => togglePrayed(item.id)}
                    className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                      item.prayedByMe
                        ? "bg-apolo-yellow text-gray-900"
                        : "bg-gray-50 text-gray-500"
                    }`}
                  >
                    {item.prayedByMe
                      ? "함께 기도 중"
                      : "함께 기도합니다"}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("이 기도제목을 삭제할까요?")) {
                        removeShare(item.id);
                      }
                    }}
                    className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M18 6L6 18M6 6L18 18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
