"use client";

import { useState } from "react";
import { useEvangelism } from "@/hooks/useEvangelism";
import { EvangelismInput, EvangelismRelationship } from "@/types/evangelism";
import LoadingDots from "@/components/ui/LoadingDots";
import RefreshButton from "@/components/ui/RefreshButton";
import CopyButton from "@/components/ui/CopyButton";
import ShareButton from "@/components/ui/ShareButton";

const RELATIONSHIP_OPTIONS: { value: EvangelismRelationship; label: string }[] = [
  { value: "family", label: "👨‍👩‍👧 가족" },
  { value: "friend", label: "😊 친구" },
  { value: "colleague", label: "💼 직장동료" },
  { value: "acquaintance", label: "🤝 지인" },
  { value: "neighbor", label: "🏠 이웃" },
];

const SITUATION_PRESETS = [
  "취업·이직 고민",
  "인간관계 어려움",
  "건강 문제",
  "가정 문제",
  "학업 스트레스",
  "삶의 의미 탐색",
  "경제적 어려움",
  "외로움·고독",
];

const INTEREST_OPTIONS = [
  { value: "positive", label: "😊 긍정적" },
  { value: "curious", label: "🤔 호기심 있음" },
  { value: "neutral", label: "😐 중립적" },
  { value: "negative", label: "😕 부정적·거부감" },
  { value: "hurt", label: "💔 교회에 상처" },
];

export default function EvangelismPage() {
  const [form, setForm] = useState<EvangelismInput>({
    targetName: "",
    relationship: "friend",
    situation: "",
    interest: "neutral",
    additionalContext: "",
  });
  const [customSituation, setCustomSituation] = useState("");
  const [editedResult, setEditedResult] = useState("");
  const { actionPoints, isLoading, generate, regenerate } = useEvangelism();

  const effectiveSituation = customSituation || form.situation;
  const isValid = form.relationship && effectiveSituation && form.interest;

  const handleGenerate = () => {
    setEditedResult("");
    generate({ ...form, situation: effectiveSituation });
  };

  const handleRegenerate = () => {
    setEditedResult("");
    regenerate({ ...form, situation: effectiveSituation });
  };

  const displayResult = editedResult || actionPoints;

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Header */}
      <div className="bg-apolo-yellow-light rounded-2xl px-4 py-3">
        <p className="text-sm text-gray-700">
          전도 대상자의 상황에 맞는 실전 전도 전략을 제안합니다. 🎯
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Target name - optional */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            이름 <span className="font-normal text-gray-400">(선택)</span>
          </label>
          <input
            type="text"
            placeholder="예: 홍길동"
            value={form.targetName || ""}
            onChange={(e) => setForm((f) => ({ ...f, targetName: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-apolo-yellow transition-shadow"
          />
        </div>

        {/* Relationship */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            관계 *
          </label>
          <div className="flex flex-wrap gap-2">
            {RELATIONSHIP_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setForm((f) => ({ ...f, relationship: opt.value }))}
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

        {/* Situation */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            현재 상황·고민 *
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {SITUATION_PRESETS.map((sit) => (
              <button
                key={sit}
                onClick={() => {
                  setForm((f) => ({ ...f, situation: sit }));
                  setCustomSituation("");
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  form.situation === sit && !customSituation
                    ? "bg-apolo-yellow text-gray-900"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {sit}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="직접 입력..."
            value={customSituation}
            onChange={(e) => {
              setCustomSituation(e.target.value);
              if (e.target.value) setForm((f) => ({ ...f, situation: "" }));
            }}
            className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-apolo-yellow transition-shadow"
          />
        </div>

        {/* Interest */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            신앙에 대한 태도 *
          </label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setForm((f) => ({ ...f, interest: opt.value }))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  form.interest === opt.value
                    ? "bg-apolo-yellow text-gray-900"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Additional context */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            추가 정보 <span className="font-normal text-gray-400">(선택)</span>
          </label>
          <textarea
            placeholder="예: 어릴 때 교회를 다닌 적 있음, 가족 중 신자 없음..."
            value={form.additionalContext || ""}
            onChange={(e) => setForm((f) => ({ ...f, additionalContext: e.target.value }))}
            className="w-full min-h-[72px] px-4 py-3 bg-gray-50 rounded-2xl text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-apolo-yellow transition-shadow"
          />
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!isValid || isLoading}
        className="w-full py-4 rounded-2xl bg-apolo-yellow text-gray-900 font-bold text-base disabled:opacity-40 active:bg-apolo-yellow-dark transition-colors"
      >
        {isLoading ? "생성 중..." : "전도 전략 생성하기 🎯"}
      </button>

      {/* Result */}
      {(isLoading || actionPoints) && (
        <div className="space-y-3 animate-fade-in-up">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              전도 전략
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
                  className="w-full min-h-[320px] p-4 rounded-2xl bg-apolo-kakao text-gray-900 text-[15px] leading-relaxed resize-none focus:outline-none shadow-bubble"
                  value={displayResult}
                  onChange={(e) => setEditedResult(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">탭하여 직접 편집 가능</p>
              </>
            )}
          </div>

          {!isLoading && actionPoints && (
            <div className="flex gap-2 flex-wrap">
              <CopyButton text={displayResult} />
              <ShareButton text={displayResult} />
            </div>
          )}
        </div>
      )}

      <div className="h-4" />
    </div>
  );
}
