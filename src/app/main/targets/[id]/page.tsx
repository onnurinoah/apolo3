"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTargets, getPrayStreak } from "@/hooks/useTargets";
import { useEvangelism } from "@/hooks/useEvangelism";
import { useInvitation } from "@/hooks/useInvitation";
import { usePrayer } from "@/hooks/usePrayer";
import { prayerTopics } from "@/data/prayerTopics";
import { PrayerTopic } from "@/types/prayer";
import {
  TargetStatus,
  STATUS_CONFIG,
  RELATIONSHIP_CONFIG,
  INTEREST_CONFIG,
  NEXT_ACTIONS,
} from "@/types/target";
import LoadingDots from "@/components/ui/LoadingDots";
import CopyButton from "@/components/ui/CopyButton";
import ShareButton from "@/components/ui/ShareButton";
import RefreshButton from "@/components/ui/RefreshButton";

type TabId = "prayer" | "strategy" | "invite";
type ContentLength = "short" | "medium" | "long";

const STATUS_ORDER: TargetStatus[] = ["praying", "approaching", "invited", "attending", "decided"];

const LENGTH_OPTIONS: { id: ContentLength; label: string }[] = [
  { id: "short", label: "짧게" },
  { id: "medium", label: "보통" },
  { id: "long", label: "깊게" },
];

type GrowthStageId = "egg" | "hatching" | "chick" | "young-chicken" | "hen";

type GrowthStage = {
  id: GrowthStageId;
  label: string;
  min: number;
  max: number | null;
};

const GROWTH_STAGES: GrowthStage[] = [
  { id: "egg", label: "알", min: 0, max: 2 },
  { id: "hatching", label: "부화 직전", min: 3, max: 6 },
  { id: "chick", label: "병아리", min: 7, max: 13 },
  { id: "young-chicken", label: "튼튼한 병아리", min: 14, max: 29 },
  { id: "hen", label: "닭", min: 30, max: null },
];

// ─── 길이 선택 ──────────────────────────────────────────────
function LengthToggle({ value, onChange }: { value: ContentLength; onChange: (v: ContentLength) => void }) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-0.5">
      {LENGTH_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
            value === opt.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function resolveGrowthStage(streak: number): GrowthStage {
  const safeStreak = Math.max(0, streak);
  return (
    GROWTH_STAGES.find((stage) => {
      if (stage.max === null) return safeStreak >= stage.min;
      return safeStreak >= stage.min && safeStreak <= stage.max;
    }) || GROWTH_STAGES[0]
  );
}

function stageProgress(stage: GrowthStage, streak: number): number {
  const safeStreak = Math.max(0, streak);
  if (stage.max === null) return 1;
  const span = stage.max - stage.min + 1;
  const current = safeStreak - stage.min + 1;
  return Math.max(0.15, Math.min(1, current / span));
}

function daysUntilNextStage(stage: GrowthStage, streak: number): number | null {
  if (stage.max === null) return null;
  return Math.max(1, stage.max - Math.max(0, streak) + 1);
}

function GrowthIcon({ stageId }: { stageId: GrowthStageId }) {
  if (stageId === "egg") {
    return (
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
        <ellipse cx="26" cy="28" rx="16" ry="20" fill="#FFF8DB" stroke="#FAB005" strokeWidth="2" />
      </svg>
    );
  }
  if (stageId === "hatching") {
    return (
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
        <ellipse cx="26" cy="28" rx="16" ry="20" fill="#FFF8DB" stroke="#FAB005" strokeWidth="2" />
        <path d="M24 17L28 22L24 26L28 31" stroke="#FAB005" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (stageId === "chick") {
    return (
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
        <circle cx="26" cy="28" r="13" fill="#FFD43B" />
        <circle cx="22" cy="25" r="1.5" fill="#4B5563" />
        <path d="M32 27L39 29L32 31V27Z" fill="#FCC419" />
        <path d="M19 40C20.5 37 22.5 35.5 24.5 35.5M27.5 35.5C29.5 35.5 31.5 37 33 40" stroke="#FAB005" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (stageId === "young-chicken") {
    return (
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
        <ellipse cx="27" cy="29" rx="15" ry="12" fill="#FFE066" />
        <circle cx="33" cy="20" r="7" fill="#FFE066" />
        <circle cx="31.5" cy="19" r="1.5" fill="#4B5563" />
        <path d="M39 20L45 22L39 24V20Z" fill="#FCC419" />
        <path d="M19 42L22 36M29 42L32 36" stroke="#FAB005" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <ellipse cx="25" cy="30" rx="16" ry="12" fill="#FFD43B" />
      <circle cx="34" cy="20" r="8" fill="#FCC419" />
      <circle cx="32.5" cy="19" r="1.5" fill="#4B5563" />
      <path d="M41 20L48 22.5L41 25V20Z" fill="#FAB005" />
      <path d="M40 12.5C38.5 10.5 36.5 10 35 11.5C34.5 10 33.5 9.5 32 10.5C31 11.2 31 12.7 31.5 14H40V12.5Z" fill="#FFE066" />
      <path d="M17 43L20 36.5M28 43L31 36.5" stroke="#FAB005" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 28L6 25L9 30" stroke="#FAB005" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── 기도 성장 위젯 ───────────────────────────────────────
function PrayerGrowthWidget({ streak, totalDays }: { streak: number; totalDays: number }) {
  const stage = resolveGrowthStage(streak);
  const progress = stageProgress(stage, streak);
  const nextIn = daysUntilNextStage(stage, streak);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3">
      <div className="flex items-center gap-3">
        <GrowthIcon stageId={stage.id} />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-gray-400">기도 성장</p>
          <p className="text-sm font-bold text-gray-900 mt-0.5">
            {stage.label} 단계 · {Math.max(0, streak)}일 연속
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            누적 기도 {Math.max(0, totalDays)}일
          </p>
          <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-300 to-amber-500 transition-all duration-500"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-amber-700 mt-1">
            {nextIn === null ? "최종 단계에 도달했어요." : `다음 단계까지 ${nextIn}일`}
          </p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
        <span>알</span>
        <span>부화</span>
        <span>병아리</span>
        <span>닭</span>
      </div>
    </div>
  );
}

// ─── 결과 표시 컴포넌트 ─────────────────────────────────────
function ResultArea({
  isLoading,
  text,
  onRegenerate,
}: {
  isLoading: boolean;
  text: string;
  onRegenerate: () => void;
}) {
  const [edited, setEdited] = useState("");
  useEffect(() => { setEdited(""); }, [text]);
  const display = edited || text;

  if (!isLoading && !text) return null;

  return (
    <div className="space-y-3 animate-fade-in-up">
      <div className="w-full">
        {isLoading ? (
          <div className="bg-apolo-kakao rounded-bubble shadow-bubble px-2 inline-block">
            <LoadingDots />
          </div>
        ) : (
          <textarea
            className="w-full min-h-[240px] p-4 rounded-2xl bg-apolo-kakao text-gray-900 text-[14px] leading-relaxed resize-none focus:outline-none shadow-bubble"
            value={display}
            onChange={(e) => setEdited(e.target.value)}
          />
        )}
      </div>
      {!isLoading && text && (
        <div className="flex gap-2 flex-wrap">
          <RefreshButton onClick={onRegenerate} disabled={isLoading} />
          <CopyButton text={display} />
          <ShareButton text={display} />
        </div>
      )}
    </div>
  );
}

// ─── 상태 배지 ──────────────────────────────────────────────
function StatusBadge({ status }: { status: TargetStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ─── 메인 페이지 ────────────────────────────────────────────
export default function TargetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { targets, loaded, prayToday, hasPrayedToday, updateStatus, removeTarget } = useTargets();
  const evangelism = useEvangelism();
  const invitation = useInvitation();
  const prayer = usePrayer();

  const [activeTab, setActiveTab] = useState<TabId>("prayer");
  const [showDelete, setShowDelete] = useState(false);

  // Prayer options
  const [prayerTopic, setPrayerTopic] = useState<PrayerTopic>("salvation");
  const [prayerLength, setPrayerLength] = useState<ContentLength>("medium");

  // Invite options
  const [inviteEvent, setInviteEvent] = useState("주일예배");
  const [inviteLocation, setInviteLocation] = useState("");
  const [inviteLength, setInviteLength] = useState<ContentLength>("medium");

  const target = targets.find((t) => t.id === id);

  // 전도전략 생성
  const handleStrategy = () => {
    if (!target) return;
    evangelism.generate({
      targetName: target.name,
      relationship: target.relationship,
      situation: target.situation,
      interest: target.interest,
      additionalContext: target.notes || "",
    });
  };
  const handleStrategyRegen = () => {
    if (!target) return;
    evangelism.regenerate({
      targetName: target.name,
      relationship: target.relationship,
      situation: target.situation,
      interest: target.interest,
      additionalContext: target.notes || "",
    });
  };

  // 초대메시지 생성
  const handleInvite = () => {
    if (!target) return;
    invitation.generate({
      personName: target.name,
      relationship: target.relationship,
      eventType: inviteEvent,
      location: inviteLocation,
      additionalContext: `${target.situation}. ${target.notes || ""}`,
      length: inviteLength,
    });
  };
  const handleInviteRegen = () => {
    if (!target) return;
    invitation.regenerate({
      personName: target.name,
      relationship: target.relationship,
      eventType: inviteEvent,
      location: inviteLocation,
      additionalContext: `${target.situation}. ${target.notes || ""}`,
      length: inviteLength,
    });
  };

  // 기도문 생성
  const handlePrayer = () => {
    if (!target) return;
    prayer.generate({
      personName: target.name,
      relationship: target.relationship,
      topic: prayerTopic,
      additionalContext: `${target.situation}. ${target.notes || ""}`,
      length: prayerLength,
    });
  };
  const handlePrayerRegen = () => {
    if (!target) return;
    prayer.regenerate({
      personName: target.name,
      relationship: target.relationship,
      topic: prayerTopic,
      additionalContext: `${target.situation}. ${target.notes || ""}`,
      length: prayerLength,
    });
  };

  if (!loaded) return null;
  if (!target) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <p className="text-gray-400">대상자를 찾을 수 없습니다.</p>
        <button onClick={() => router.push("/main/targets")} className="mt-4 text-sm text-apolo-yellow-dark font-semibold">
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const streak = getPrayStreak(target);
  const prayed = hasPrayedToday(id);
  const rel = RELATIONSHIP_CONFIG[target.relationship];
  const interestCfg = INTEREST_CONFIG[target.interest];
  const currentStatusIdx = STATUS_ORDER.indexOf(target.status);

  return (
    <div className="flex flex-col min-h-full">
      {/* ─── 헤더 ───────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/main/targets")}
            className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center active:bg-gray-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900 truncate">{target.name}</h1>
              <StatusBadge status={target.status} />
            </div>
            <p className="text-xs text-gray-400 truncate">
              {rel.label} · {interestCfg.label} · {target.situation}
            </p>
          </div>
          <button onClick={() => setShowDelete(!showDelete)} className="text-gray-300 text-lg">⋮</button>
        </div>

        {showDelete && (
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => { removeTarget(id); router.push("/main/targets"); }}
              className="px-3 py-1.5 bg-red-50 text-red-500 rounded-xl text-xs font-medium"
            >
              삭제하기
            </button>
          </div>
        )}
      </div>

      {/* ─── 상태 진행바 ─────────────────────────────────── */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-1">
          {STATUS_ORDER.map((s, i) => {
            const cfg = STATUS_CONFIG[s];
            const isCurrent = target.status === s;
            const isPast = i < currentStatusIdx;
            return (
              <button
                key={s}
                onClick={() => updateStatus(id, s)}
                className={`flex-1 py-2 rounded-xl text-[11px] font-semibold text-center transition-all ${
                  isCurrent
                    ? "bg-apolo-yellow text-gray-900 shadow-sm"
                    : isPast
                    ? "bg-apolo-yellow-light text-amber-700"
                    : "bg-gray-50 text-gray-400"
                }`}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 기도 버튼 + 스트릭 ─────────────────────────── */}
      <div className="px-4 pb-3">
        <button
          onClick={() => { prayToday(id); }}
          disabled={prayed}
          className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all ${
            prayed
              ? "bg-green-50 text-green-600 border border-green-200"
              : "bg-apolo-yellow text-gray-900 active:bg-apolo-yellow-dark shadow-sm"
          }`}
        >
          {prayed ? "오늘 기도 완료" : "오늘 기도했어요"}
        </button>
      </div>

      {/* ─── 기도 성장 ───────────────────────────────────── */}
      <div className="px-4 pb-4">
        <PrayerGrowthWidget streak={streak} totalDays={target.prayerDates.length} />
      </div>

      {/* ─── 다음 액션 추천 ─────────────────────────────── */}
      <div className="px-4 pb-4">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl px-4 py-3">
          <p className="text-xs font-bold text-amber-800 mb-1.5">다음 단계 추천</p>
          <div className="space-y-1">
            {NEXT_ACTIONS[target.status].map((action, i) => (
              <p key={i} className="text-xs text-amber-700">
                {i + 1}. {action}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 하단 탭: 기도문 받기 | 전도 컨설팅 | 초대메시지 생성 ───── */}
      <div className="px-4">
        <div className="flex bg-gray-100 rounded-xl p-1">
          {(
            [
              { id: "prayer" as TabId, label: "기도문 받기" },
              { id: "strategy" as TabId, label: "전도 컨설팅" },
              { id: "invite" as TabId, label: "초대메시지 생성" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                activeTab === tab.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 탭 콘텐츠 ──────────────────────────────────── */}
      <div className="px-4 py-4 flex-1">
        {activeTab === "prayer" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400">
              대상자를 위한 중보기도문을 생성합니다.
            </p>

            {/* 주제 선택 */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">기도 주제</p>
              <div className="flex flex-wrap gap-1.5">
                {prayerTopics.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setPrayerTopic(t.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      prayerTopic === t.id ? "bg-apolo-yellow text-gray-900" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {t.nameKo}
                  </button>
                ))}
              </div>
            </div>

            {/* 길이 선택 */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">길이</p>
              <LengthToggle value={prayerLength} onChange={setPrayerLength} />
            </div>

            {!prayer.prayer && !prayer.isLoading && (
              <button
                onClick={handlePrayer}
                className="w-full py-3 rounded-2xl bg-blue-500 text-white font-bold text-sm active:bg-blue-600 transition-colors"
              >
                기도문 받기
              </button>
            )}
            <ResultArea
              isLoading={prayer.isLoading}
              text={prayer.prayer}
              onRegenerate={handlePrayerRegen}
            />
          </div>
        )}

        {activeTab === "strategy" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400">
              대상자의 상황에 맞는 맞춤 전도 컨설팅을 제공합니다.
            </p>
            {!evangelism.actionPoints && !evangelism.isLoading && (
              <button
                onClick={handleStrategy}
                className="w-full py-3 rounded-2xl bg-amber-500 text-white font-bold text-sm active:bg-amber-600 transition-colors"
              >
                전도 컨설팅 받기
              </button>
            )}
            <ResultArea
              isLoading={evangelism.isLoading}
              text={evangelism.actionPoints}
              onRegenerate={handleStrategyRegen}
            />
          </div>
        )}

        {activeTab === "invite" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400">
              대상자에게 보낼 카카오톡 초대메시지를 생성합니다.
            </p>

            {/* 모임명 */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">모임명</p>
              <input
                type="text"
                value={inviteEvent}
                onChange={(e) => setInviteEvent(e.target.value)}
                placeholder="예: 주일예배, 청년부 모임"
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-apolo-yellow"
              />
            </div>

            {/* 장소 (선택) */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">장소 <span className="font-normal text-gray-400">(선택)</span></p>
              <input
                type="text"
                value={inviteLocation}
                onChange={(e) => setInviteLocation(e.target.value)}
                placeholder="예: 온누리교회 양재캠퍼스"
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-apolo-yellow"
              />
            </div>

            {/* 길이 선택 */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">메시지 길이</p>
              <LengthToggle value={inviteLength} onChange={setInviteLength} />
            </div>

            {!invitation.message && !invitation.isLoading && (
              <button
                onClick={handleInvite}
                className="w-full py-3 rounded-2xl bg-purple-500 text-white font-bold text-sm active:bg-purple-600 transition-colors"
              >
                초대메시지 생성
              </button>
            )}
            <ResultArea
              isLoading={invitation.isLoading}
              text={invitation.message}
              onRegenerate={handleInviteRegen}
            />
          </div>
        )}

      </div>

      {/* 메모 */}
      {target.notes && (
        <div className="px-4 pb-6">
          <div className="bg-gray-50 rounded-2xl px-4 py-3">
            <p className="text-[11px] text-gray-400 mb-1">메모</p>
            <p className="text-xs text-gray-600 leading-relaxed">{target.notes}</p>
          </div>
        </div>
      )}

      <div className="h-4" />
    </div>
  );
}
