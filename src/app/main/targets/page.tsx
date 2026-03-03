"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useTargets } from "@/hooks/useTargets";
import { josa } from "@/lib/korean";
import Onboarding, { useOnboarding } from "@/components/Onboarding";
import {
  EvangelismTarget,
  TargetRelationship,
  TargetInterest,
  STATUS_CONFIG,
  RELATIONSHIP_CONFIG,
  INTEREST_CONFIG,
} from "@/types/target";
type GatheringConfig = {
  isOpen: boolean;
  eventName: string;
  eventDate: string | null;
};

// ─── 상태 배지 ───────────────────────────────────────────────
function StatusBadge({ status }: { status: EvangelismTarget["status"] }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-full text-sm font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ─── 대상자 카드 ─────────────────────────────────────────────
function TargetCard({
  target,
  onIntercede,
}: {
  target: EvangelismTarget;
  onIntercede: (target: EvangelismTarget) => void;
}) {
  const rel = RELATIONSHIP_CONFIG[target.relationship];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl font-bold text-gray-900 truncate">
              {target.name}
            </span>
            <StatusBadge status={target.status} />
          </div>
          <p className="mt-1 text-sm text-gray-500">{rel.label}</p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <button
            onClick={() => onIntercede(target)}
            className="inline-flex items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 whitespace-nowrap active:bg-amber-100"
          >
            중보했어요
          </button>
          <Link
            href={`/main/targets/${target.id}`}
            className="inline-flex items-center justify-center rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 px-3.5 py-2 text-sm font-semibold text-amber-900 whitespace-nowrap active:brightness-95"
          >
            더보기
          </Link>
        </div>
      </div>
    </div>
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
        <label className="block text-sm font-semibold text-gray-500 mb-1">이름 또는 호칭 *</label>
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
        <label className="block text-sm font-semibold text-gray-500 mb-1">관계 *</label>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(RELATIONSHIP_CONFIG) as [TargetRelationship, { label: string }][]).map(
            ([key, cfg]) => (
              <button
                key={key}
                onClick={() => setRelationship(key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
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
        <label className="block text-sm font-semibold text-gray-500 mb-1">현재 상황 * <span className="font-normal text-gray-400">(복수 선택 가능)</span></label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {SITUATION_PRESETS.map((s) => (
            <button
              key={s}
              onClick={() => toggleSituation(s)}
              className={`px-2.5 py-1 rounded-full text-sm font-medium transition-colors ${
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
          <p className="mt-1.5 text-sm text-gray-400 truncate">
            선택됨: {effectiveSituation}
          </p>
        )}
      </div>

      {/* 신앙 태도 */}
      <div>
        <label className="block text-sm font-semibold text-gray-500 mb-1">신앙에 대한 태도</label>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(INTEREST_CONFIG) as [TargetInterest, { label: string }][]).map(
            ([key, cfg]) => (
              <button
                key={key}
                onClick={() => setInterest(key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
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
        <label className="block text-sm font-semibold text-gray-500 mb-1">
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
      <p className="text-base text-gray-500 mb-6 leading-relaxed">
        이름과 상황을 기록하면<br />
        맞춤 전도 전략, 기도문, 초대 메시지를<br />
        한곳에서 관리할 수 있어요.
      </p>
      <button
        onClick={onAdd}
        className="px-6 py-3 rounded-2xl bg-apolo-yellow text-gray-900 font-bold text-base active:bg-apolo-yellow-dark transition-colors"
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
  const [globalTargetCount, setGlobalTargetCount] = useState<number | null>(null);
  const [isGlobalTargetCount, setIsGlobalTargetCount] = useState(false);
  const [gatheringConfig, setGatheringConfig] = useState<GatheringConfig>({
    isOpen: false,
    eventName: "",
    eventDate: null,
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    let alive = true;
    async function loadExtras() {
      try {
        const [countRes, cfgRes, meRes] = await Promise.all([
          fetch("/api/metrics/targets-total", { cache: "no-store" }),
          fetch("/api/gathering/config", { cache: "no-store" }),
          fetch("/api/admin/me", { cache: "no-store" }),
        ]);
        const [countData, cfgData, meData] = await Promise.all([
          countRes.json(),
          cfgRes.json(),
          meRes.json(),
        ]);

        if (!alive) return;
        if (typeof countData.count === "number") {
          setGlobalTargetCount(countData.count);
          setIsGlobalTargetCount(Boolean(countData.isGlobal));
        }
        setGatheringConfig({
          isOpen: Boolean(cfgData.isOpen),
          eventName: cfgData.eventName ?? "",
          eventDate: cfgData.eventDate ?? null,
        });
        setIsAdmin(Boolean(meData.isAdmin));
      } catch {
        // non-critical
      }
    }
    void loadExtras();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(""), 1800);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const todayStr = new Date().toISOString().split("T")[0];
  const missionTarget = targets.find((t) => !t.prayerDates.includes(todayStr)) || targets[0];
  const missionText = missionTarget
    ? !missionTarget.prayerDates.includes(todayStr)
      ? `${missionTarget.name}${josa(missionTarget.name, "을/를")} 위해 오늘 기도 체크`
      : `${missionTarget.name}에게 안부 메시지 보내기`
    : "오늘 대상자 1명 등록하기";

  const handleAdd = useCallback(
    (input: Omit<EvangelismTarget, "id" | "createdAt" | "prayerDates" | "status">) => {
      addTarget(input);
    },
    [addTarget]
  );
  const handleIntercede = useCallback((_target: EvangelismTarget) => {
    setToastMessage("오늘 중보기도가 쌓였습니다.");
  }, []);
  const hasGatheringNotice = gatheringConfig.isOpen && Boolean(gatheringConfig.eventName);

  if (showOnboarding) return <Onboarding onDone={onboardingDone} />;
  if (!loaded) return null;

  return (
    <div className="px-4 py-4 space-y-4">
      {hasGatheringNotice && (
        <div className="bg-amber-200 border border-amber-400 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-amber-950">
              집회초대 등록 열림
            </p>
            <p className="text-base font-extrabold text-amber-950 truncate">
              {gatheringConfig.eventName}
              {gatheringConfig.eventDate ? ` · ${gatheringConfig.eventDate}` : ""}
            </p>
          </div>
          <Link
            href="/main/gathering"
            className="shrink-0 px-3 py-2 rounded-xl bg-amber-900 text-amber-50 text-sm font-extrabold"
          >
            등록
          </Link>
        </div>
      )}

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">내 전도 대상자</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            내 대상자 {targets.length}명
            {globalTargetCount !== null &&
              ` · ${
                isGlobalTargetCount ? "전체" : "현재 사용자"
              } ${globalTargetCount.toLocaleString()}명`}
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/main/admin"
            className="whitespace-nowrap px-3 py-1.5 rounded-full border border-gray-200 text-xs font-semibold text-gray-600"
          >
            관리자
          </Link>
        )}
      </div>

      {!showForm && (
        <div
          className={`rounded-2xl border px-4 py-3 ${
            hasGatheringNotice
              ? "bg-amber-50 border-amber-100"
              : "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-100"
          }`}
        >
          <p className={`text-sm font-semibold ${hasGatheringNotice ? "text-amber-600" : "text-amber-700"}`}>
            오늘의 한 걸음
          </p>
          <p className={`text-base font-bold mt-0.5 ${hasGatheringNotice ? "text-amber-800" : "text-amber-900"}`}>
            {missionText}
          </p>
        </div>
      )}

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
            <TargetCard key={target.id} target={target} onIntercede={handleIntercede} />
          ))}
        </div>
      )}

      <div className="h-16" />

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full bg-apolo-yellow shadow-lg flex items-center justify-center active:bg-apolo-yellow-dark"
          aria-label="대상자 추가"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2.7" strokeLinecap="round" />
          </svg>
        </button>
      )}
      {toastMessage && (
        <div className="fixed bottom-[102px] left-1/2 z-50 -translate-x-1/2 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toastMessage}
        </div>
      )}

    </div>
  );
}
