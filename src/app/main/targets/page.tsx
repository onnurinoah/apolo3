"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useTargets, getPrayStreak, getDaysSinceLastPrayer } from "@/hooks/useTargets";
import Onboarding, { useOnboarding } from "@/components/Onboarding";
import {
  EvangelismTarget,
  TargetRelationship,
  TargetInterest,
  STATUS_CONFIG,
  RELATIONSHIP_CONFIG,
  INTEREST_CONFIG,
  NEXT_ACTIONS,
} from "@/types/target";

// ─── 상태 배지 ───────────────────────────────────────────────
function StatusBadge({ status }: { status: EvangelismTarget["status"] }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ─── 대상자 카드 ─────────────────────────────────────────────
function TargetCard({ target }: { target: EvangelismTarget }) {
  const streak = getPrayStreak(target);
  const daysSince = getDaysSinceLastPrayer(target);
  const rel = RELATIONSHIP_CONFIG[target.relationship];
  const nextAction = NEXT_ACTIONS[target.status][0];

  return (
    <Link
      href={`/main/targets/${target.id}`}
      className="block bg-white rounded-2xl shadow-card border border-gray-50 px-4 py-4 active:bg-gray-50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        {/* 왼쪽: 이름 + 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-base font-bold text-gray-900">{target.name}</span>
            <StatusBadge status={target.status} />
          </div>

          <p className="text-xs text-gray-400 mb-2">
            {rel.label}
            {target.situation && <> · {target.situation}</>}
          </p>

          {/* 기도 스트릭 */}
          <div className="flex items-center gap-3">
            {streak > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600">
                {streak}일 연속 기도
              </span>
            )}
            {daysSince !== null && daysSince > 0 && (
              <span className="text-[11px] text-gray-300">
                {daysSince === 1 ? "어제" : `${daysSince}일 전`} 기도
              </span>
            )}
            {daysSince === 0 && (
              <span className="text-[11px] text-green-500 font-medium">오늘 기도 완료 ✓</span>
            )}
            {daysSince === null && (
              <span className="text-[11px] text-gray-300">아직 기도 기록 없음</span>
            )}
          </div>

          {/* 다음 액션 추천 */}
          <div className="mt-2 px-3 py-1.5 bg-amber-50 rounded-xl">
            <p className="text-[11px] text-amber-700">
              다음 단계: {nextAction}
            </p>
          </div>
        </div>

        {/* 오른쪽: 화살표 */}
        <div className="flex-shrink-0 mt-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 18L15 12L9 6" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

// ─── 대상자 추가 폼 ─────────────────────────────────────────
const SITUATION_PRESETS = [
  "취업·이직 고민", "인간관계 어려움", "건강 문제", "가정 문제",
  "학업 스트레스", "삶의 의미 탐색", "경제적 어려움", "외로움·고독",
];

function AddTargetForm({
  onAdd,
  onClose,
}: {
  onAdd: (t: Omit<EvangelismTarget, "id" | "createdAt" | "prayerDates" | "status">) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState<TargetRelationship>("friend");
  const [selectedSituations, setSelectedSituations] = useState<string[]>([]);
  const [customSituation, setCustomSituation] = useState("");
  const [interest, setInterest] = useState<TargetInterest>("neutral");
  const [notes, setNotes] = useState("");

  const effectiveSituation = [...selectedSituations, customSituation.trim()]
    .filter(Boolean)
    .join(" · ");

  const toggleSituation = (value: string) => {
    setSelectedSituations((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const handleSubmit = () => {
    if (!name.trim() || !effectiveSituation) return;
    onAdd({
      name: name.trim(),
      relationship,
      situation: effectiveSituation,
      interest,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-gray-900">전도 대상자 등록</h3>
        <button onClick={onClose} className="text-gray-400 text-sm">닫기</button>
      </div>

      {/* 이름 */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">이름 또는 호칭 *</label>
        <input
          type="text"
          placeholder="예: 엄마, 준이, 영희"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-apolo-yellow"
        />
      </div>

      {/* 관계 */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">관계 *</label>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(RELATIONSHIP_CONFIG) as [TargetRelationship, { label: string }][]).map(
            ([key, cfg]) => (
              <button
                key={key}
                onClick={() => setRelationship(key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  relationship === key ? "bg-apolo-yellow text-gray-900" : "bg-gray-100 text-gray-500"
                }`}
              >
                {cfg.label}
              </button>
            )
          )}
        </div>
      </div>

      {/* 상황 */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">현재 상황 * <span className="font-normal text-gray-400">(복수 선택 가능)</span></label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {SITUATION_PRESETS.map((s) => (
            <button
              key={s}
              onClick={() => toggleSituation(s)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                selectedSituations.includes(s) ? "bg-apolo-yellow text-gray-900" : "bg-gray-100 text-gray-500"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="직접 입력..."
          value={customSituation}
          onChange={(e) => setCustomSituation(e.target.value)}
          className="w-full px-4 py-2.5 bg-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-apolo-yellow"
        />
        {effectiveSituation && (
          <p className="mt-1.5 text-[11px] text-gray-400 truncate">
            선택됨: {effectiveSituation}
          </p>
        )}
      </div>

      {/* 신앙 태도 */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">신앙에 대한 태도</label>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(INTEREST_CONFIG) as [TargetInterest, { label: string }][]).map(
            ([key, cfg]) => (
              <button
                key={key}
                onClick={() => setInterest(key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  interest === key ? "bg-apolo-yellow text-gray-900" : "bg-gray-100 text-gray-500"
                }`}
              >
                {cfg.label}
              </button>
            )
          )}
        </div>
      </div>

      {/* 메모 */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">
          메모 <span className="font-normal text-gray-400">(선택)</span>
        </label>
        <textarea
          placeholder="예: 어릴 때 교회 다녔음, 최근 이직 고민..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full min-h-[64px] px-4 py-2.5 bg-gray-50 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-apolo-yellow"
        />
      </div>

      {/* 등록 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={!name.trim() || !effectiveSituation}
        className="w-full py-3.5 rounded-2xl bg-apolo-yellow text-gray-900 font-bold text-sm disabled:opacity-40 active:bg-apolo-yellow-dark transition-colors"
      >
        등록하기
      </button>
    </div>
  );
}

// ─── 빈 상태 ────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-apolo-yellow-light flex items-center justify-center mb-5">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke="#F59F00" strokeWidth="1.5" />
          <path d="M5 20C5 16.134 8.134 13 12 13C15.866 13 19 16.134 19 20" stroke="#F59F00" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 13V17M10 15H14" stroke="#F59F00" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">
        전도 대상자를 등록해보세요
      </h3>
      <p className="text-sm text-gray-400 mb-6 leading-relaxed">
        이름과 상황을 기록하면<br />
        맞춤 전도 전략, 기도문, 초대 메시지를<br />
        한곳에서 관리할 수 있어요.
      </p>
      <button
        onClick={onAdd}
        className="px-6 py-3 rounded-2xl bg-apolo-yellow text-gray-900 font-bold text-sm active:bg-apolo-yellow-dark transition-colors"
      >
        첫 번째 대상자 등록하기
      </button>
    </div>
  );
}

// ─── 메인 페이지 ────────────────────────────────────────────
export default function TargetsPage() {
  const { targets, loaded, addTarget } = useTargets();
  const { show: showOnboarding, done: onboardingDone } = useOnboarding();
  const [showForm, setShowForm] = useState(false);

  const handleAdd = useCallback(
    (input: Omit<EvangelismTarget, "id" | "createdAt" | "prayerDates" | "status">) => {
      addTarget(input);
    },
    [addTarget]
  );

  if (showOnboarding) return <Onboarding onDone={onboardingDone} />;
  if (!loaded) return null;

  return (
    <div className="px-4 py-4 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">내 전도 대상자</h2>
          {targets.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">{targets.length}명을 위해 기도하고 있어요</p>
          )}
        </div>
        {targets.length > 0 && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-9 h-9 rounded-full bg-apolo-yellow flex items-center justify-center active:bg-apolo-yellow-dark transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* 추가 폼 */}
      {showForm && (
        <AddTargetForm onAdd={handleAdd} onClose={() => setShowForm(false)} />
      )}

      {/* 목록 또는 빈 상태 */}
      {targets.length === 0 && !showForm ? (
        <EmptyState onAdd={() => setShowForm(true)} />
      ) : (
        <div className="space-y-3">
          {targets.map((target) => (
            <TargetCard key={target.id} target={target} />
          ))}
        </div>
      )}

      <div className="h-4" />
    </div>
  );
}
