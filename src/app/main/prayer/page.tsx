"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePrayer } from "@/hooks/usePrayer";
import { usePrayerShares } from "@/hooks/usePrayerShares";
import { PrayerInput, PrayerTopic, PrayerRelationship } from "@/types/prayer";
import { prayerTopics } from "@/data/prayerTopics";
import LoadingDots from "@/components/ui/LoadingDots";
import RefreshButton from "@/components/ui/RefreshButton";
import CopyButton from "@/components/ui/CopyButton";
import ShareButton from "@/components/ui/ShareButton";

type PrayerLength = "short" | "medium" | "long";

const RELATIONSHIP_OPTIONS: { value: PrayerRelationship; label: string }[] = [
  { value: "family", label: "가족" },
  { value: "friend", label: "친구" },
  { value: "acquaintance", label: "지인" },
  { value: "self", label: "나 자신" },
];

const LENGTH_OPTIONS: { value: PrayerLength; label: string }[] = [
  { value: "short", label: "짧게" },
  { value: "medium", label: "보통" },
  { value: "long", label: "깊게" },
];

export default function PrayerPage() {
  const [form, setForm] = useState<PrayerInput>({
    personName: "",
    relationship: "friend",
    topic: "salvation",
    additionalContext: "",
    length: "medium",
  });
  const [editedPrayer, setEditedPrayer] = useState("");
  const [shared, setShared] = useState(false);
  const { prayer, isLoading, generate, regenerate } = usePrayer();
  const { addShare } = usePrayerShares();
  const router = useRouter();

  const isValid = form.topic && form.relationship;

  const handleGenerate = () => {
    setEditedPrayer("");
    setShared(false);
    generate(form);
  };

  const handleRegenerate = () => {
    setEditedPrayer("");
    regenerate(form);
  };

  const displayPrayer = editedPrayer || prayer;

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3">
        <p className="text-sm text-gray-600">
          간편 생성 화면입니다. 대상자 상세에서 더 빠르게 작성할 수 있습니다.
        </p>
        <Link
          href="/main/targets"
          className="mt-2 inline-flex text-xs font-semibold text-apolo-yellow-dark"
        >
          내 전도 대상자에서 사용하기 →
        </Link>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            이름 또는 호칭 (선택)
          </label>
          <input
            type="text"
            placeholder="예: 엄마, 준이, 영희"
            value={form.personName}
            onChange={(e) =>
              setForm((f) => ({ ...f, personName: e.target.value }))
            }
            className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-apolo-yellow transition-shadow"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            관계
          </label>
          <div className="flex flex-wrap gap-2">
            {RELATIONSHIP_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() =>
                  setForm((f) => ({ ...f, relationship: opt.value }))
                }
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  form.relationship === opt.value
                    ? "bg-apolo-yellow text-gray-900"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            기도 주제
          </label>
          <div className="flex flex-wrap gap-2">
            {prayerTopics.map((t) => (
              <button
                key={t.id}
                onClick={() =>
                  setForm((f) => ({ ...f, topic: t.id as PrayerTopic }))
                }
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  form.topic === t.id
                    ? "bg-apolo-yellow text-gray-900"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {t.nameKo}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            기도문 길이
          </label>
          <div className="flex gap-2">
            {LENGTH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setForm((f) => ({ ...f, length: opt.value }))}
                className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-colors ${
                  form.length === opt.value
                    ? "bg-apolo-yellow text-gray-900"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            추가 기도 내용 (선택)
          </label>
          <textarea
            placeholder="예: 최근 직장 스트레스로 많이 지쳐 있습니다"
            value={form.additionalContext || ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, additionalContext: e.target.value }))
            }
            className="w-full min-h-[80px] px-4 py-3 bg-gray-50 rounded-2xl text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-apolo-yellow transition-shadow"
          />
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={!isValid || isLoading}
        className="w-full py-4 rounded-2xl bg-apolo-yellow text-gray-900 font-bold text-base disabled:opacity-40 active:bg-apolo-yellow-dark transition-colors"
      >
        {isLoading ? "생성 중..." : "기도문 생성하기"}
      </button>

      {(isLoading || prayer) && (
        <div className="space-y-3 animate-fade-in-up">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              생성된 기도문
            </p>
            {!isLoading && (
              <RefreshButton onClick={handleRegenerate} disabled={isLoading} />
            )}
          </div>

          <div className="w-full">
            {isLoading ? (
              <div className="bg-apolo-kakao rounded-bubble shadow-bubble px-2 inline-block">
                <LoadingDots />
              </div>
            ) : (
              <>
                <textarea
                  className="w-full min-h-[220px] p-4 rounded-2xl bg-apolo-kakao text-gray-900 text-[15px] leading-relaxed resize-none focus:outline-none shadow-bubble"
                  value={displayPrayer}
                  onChange={(e) => setEditedPrayer(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">탭하여 직접 편집 가능</p>
              </>
            )}
          </div>

          {!isLoading && prayer && (
            <>
              <div className="flex gap-2 flex-wrap">
                <CopyButton text={displayPrayer} />
                <ShareButton text={displayPrayer} />
              </div>

              {!shared ? (
                <button
                  onClick={() => {
                    const name = form.personName.trim();
                    const safeName = name
                      ? `${name.slice(0, 1)}${"○".repeat(Math.max(1, name.length - 1))}`
                      : "소중한 분";
                    addShare({
                      title: `${safeName}을 위한 기도`,
                      request: name
                        ? displayPrayer.replace(new RegExp(name, "g"), safeName)
                        : displayPrayer,
                      isAnonymous: true,
                      targetName: safeName,
                      topic: form.topic,
                    });
                    setShared(true);
                  }}
                  className="w-full rounded-2xl border border-apolo-yellow/50 bg-white px-4 py-3 text-sm font-semibold text-gray-700 active:bg-apolo-yellow-light/30 transition-colors"
                >
                  기도 나눔 게시판에 올리기
                </button>
              ) : (
                <button
                  onClick={() => router.push("/main/community")}
                  className="w-full rounded-2xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700"
                >
                  나눔 완료! 게시판 보러가기 →
                </button>
              )}
            </>
          )}
        </div>
      )}

      <div className="h-4" />
    </div>
  );
}
