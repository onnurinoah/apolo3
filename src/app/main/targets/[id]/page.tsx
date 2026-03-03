"use client";

import { TouchEvent, useRef, useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTargets, getPrayStreak } from "@/hooks/useTargets";
import { useEvangelism } from "@/hooks/useEvangelism";
import { useInvitation } from "@/hooks/useInvitation";
import { usePrayer } from "@/hooks/usePrayer";
import { prayerTopics } from "@/data/prayerTopics";
import { PrayerTopic } from "@/types/prayer";
import {
  TargetStatus,
  TargetRelationship,
  TargetInterest,
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
const TAB_ORDER: TabId[] = ["prayer", "strategy", "invite"];

const STATUS_ORDER: TargetStatus[] = ["praying", "approaching", "invited", "attending", "decided"];

const LENGTH_OPTIONS: { id: ContentLength; label: string }[] = [
  { id: "short", label: "짧게" },
  { id: "medium", label: "보통" },
  { id: "long", label: "깊게" },
];

const GROWTH_STAGE_TOTAL = 5;
const GROWTH_STAGE_COLORS = ["#FFF9DB", "#FFF3BF", "#FFE066", "#FFD43B", "#FFC107"];

type GrowthStageId = "egg" | "cracked" | "chick" | "young" | "adult";
type GrowthStage = { id: GrowthStageId; min: number; max: number | null };

const GROWTH_STAGES: GrowthStage[] = [
  { id: "egg", min: 0, max: 2 },
  { id: "cracked", min: 3, max: 6 },
  { id: "chick", min: 7, max: 13 },
  { id: "young", min: 14, max: 24 },
  { id: "adult", min: 25, max: null },
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
  for (const stage of GROWTH_STAGES) {
    if (stage.max === null && safeStreak >= stage.min) return stage;
    if (stage.max !== null && safeStreak >= stage.min && safeStreak <= stage.max) return stage;
  }
  return GROWTH_STAGES[0];
}

function daysUntilNextStage(stage: GrowthStage, streak: number): number | null {
  if (stage.max === null) return null;
  return Math.max(1, stage.max - Math.max(0, streak) + 1);
}

function GrowthCharacter({ stage }: { stage: GrowthStage }) {
  if (stage.id === "egg") {
    return (
      <svg width="82" height="82" viewBox="0 0 82 82" fill="none">
        <defs>
          <radialGradient id="eggFill" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(33 24) rotate(61) scale(44 39)">
            <stop stopColor="#FFFFFF" />
            <stop offset="0.65" stopColor="#FFF3BF" />
            <stop offset="1" stopColor="#FFE066" />
          </radialGradient>
          <filter id="softShadow" x="4" y="8" width="74" height="72" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#F1C84A" floodOpacity="0.45" />
          </filter>
        </defs>
        <ellipse cx="41" cy="69" rx="18" ry="4" fill="#FFE8A1" opacity="0.45" />
        <g filter="url(#softShadow)">
          <ellipse cx="41" cy="41" rx="22" ry="29" fill="url(#eggFill)" stroke="#FFD43B" strokeWidth="2.5" />
          <ellipse cx="34" cy="30" rx="8" ry="5" fill="white" opacity="0.45" />
        </g>
      </svg>
    );
  }

  if (stage.id === "cracked") {
    return (
      <svg width="82" height="82" viewBox="0 0 82 82" fill="none">
        <defs>
          <radialGradient id="crackEggFill" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(34 24) rotate(62) scale(44 39)">
            <stop stopColor="#FFFFFF" />
            <stop offset="0.64" stopColor="#FFF0B0" />
            <stop offset="1" stopColor="#FFD43B" />
          </radialGradient>
          <filter id="crackShadow" x="4" y="8" width="74" height="72" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#EFBB26" floodOpacity="0.45" />
          </filter>
        </defs>
        <ellipse cx="41" cy="69" rx="18" ry="4" fill="#FFE8A1" opacity="0.45" />
        <g filter="url(#crackShadow)">
          <ellipse cx="41" cy="41" rx="22" ry="29" fill="url(#crackEggFill)" stroke="#FFC107" strokeWidth="2.5" />
        </g>
        <path
          d="M37 21L43 28L37 34L46 42L39 50"
          stroke="#FAB005"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="54" cy="24" r="2.5" fill="#FFE066" />
      </svg>
    );
  }

  if (stage.id === "chick") {
    return (
      <svg width="82" height="82" viewBox="0 0 82 82" fill="none">
        <defs>
          <radialGradient id="chickBody" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(36 28) rotate(58) scale(40 34)">
            <stop stopColor="#FFF9DB" />
            <stop offset="0.55" stopColor="#FFE066" />
            <stop offset="1" stopColor="#FFD43B" />
          </radialGradient>
          <filter id="chickShadow" x="8" y="10" width="66" height="66" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#EAB308" floodOpacity="0.38" />
          </filter>
        </defs>
        <ellipse cx="41" cy="69" rx="18" ry="4" fill="#FFE8A1" opacity="0.45" />
        <g filter="url(#chickShadow)">
          <circle cx="41" cy="43" r="19" fill="url(#chickBody)" />
          <ellipse cx="47.5" cy="47" rx="7" ry="5.2" fill="#FFF3BF" opacity="0.62" />
        </g>
        <circle cx="34.5" cy="39.5" r="2.2" fill="#3F3F46" />
        <circle cx="35.2" cy="38.8" r="0.7" fill="white" />
        <path d="M50 42L60 45.5L50 49V42Z" fill="#FFC107" />
        <path d="M31 61L34.5 55M43 61L46.5 55" stroke="#FAB005" strokeWidth="2.3" strokeLinecap="round" />
      </svg>
    );
  }

  if (stage.id === "young") {
    return (
      <svg width="82" height="82" viewBox="0 0 82 82" fill="none">
        <defs>
          <radialGradient id="youngBody" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(33 29) rotate(52) scale(44 34)">
            <stop stopColor="#FFF7CF" />
            <stop offset="0.55" stopColor="#FFD43B" />
            <stop offset="1" stopColor="#FFC107" />
          </radialGradient>
          <filter id="youngShadow" x="5" y="8" width="74" height="70" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="4" stdDeviation="3.5" floodColor="#D9A307" floodOpacity="0.35" />
          </filter>
        </defs>
        <ellipse cx="41" cy="69" rx="20" ry="4.5" fill="#FFE8A1" opacity="0.45" />
        <g filter="url(#youngShadow)">
          <ellipse cx="37.5" cy="46.5" rx="20.5" ry="14.5" fill="url(#youngBody)" />
          <circle cx="53" cy="35" r="10" fill="#FFD43B" />
          <ellipse cx="30" cy="46.5" rx="7.5" ry="5.2" fill="#FFF3BF" opacity="0.7" />
        </g>
        <circle cx="50.5" cy="33.5" r="2.1" fill="#3F3F46" />
        <circle cx="51.2" cy="32.8" r="0.7" fill="white" />
        <path d="M60.5 35L70.5 38L60.5 41V35Z" fill="#FAB005" />
        <path d="M31 63L35 56M44 63L48 56" stroke="#F59F00" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg width="82" height="82" viewBox="0 0 82 82" fill="none">
      <defs>
        <radialGradient id="adultBody" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(30 30) rotate(50) scale(46 34)">
          <stop stopColor="#FFF3BF" />
          <stop offset="0.52" stopColor="#FFD43B" />
          <stop offset="1" stopColor="#FFB800" />
        </radialGradient>
        <filter id="adultShadow" x="4" y="7" width="76" height="72" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="4" stdDeviation="3.5" floodColor="#B8860B" floodOpacity="0.34" />
        </filter>
      </defs>
      <ellipse cx="41" cy="69" rx="21" ry="4.7" fill="#FFE8A1" opacity="0.45" />
      <g filter="url(#adultShadow)">
        <ellipse cx="35.5" cy="47" rx="22" ry="15" fill="url(#adultBody)" />
        <circle cx="53" cy="34" r="11.2" fill="#FFC107" />
        <ellipse cx="26.5" cy="47" rx="8.5" ry="5.7" fill="#FFF3BF" opacity="0.82" />
      </g>
      <path d="M57 23.5C54.8 20 51.8 19.4 49.9 21.9C49.1 19.8 47.6 19.4 45.6 21C44.4 22 44.3 23.9 45 25.9H57V23.5Z" fill="#FFE066" />
      <circle cx="50.3" cy="32.3" r="2.2" fill="#3F3F46" />
      <circle cx="51" cy="31.6" r="0.7" fill="white" />
      <path d="M60.5 34.5L72 38.3L60.5 41.8V34.5Z" fill="#F59F00" />
      <path d="M28 64L32.4 56M42.5 64L46.9 56" stroke="#F59F00" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M13.5 47L8 43L12 49.5" stroke="#F59F00" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── 기도 성장 위젯 ───────────────────────────────────────
function PrayerGrowthWidget({ streak }: { streak: number }) {
  const safeStreak = Math.max(0, streak);
  const stage = resolveGrowthStage(safeStreak);
  const stageIndex = GROWTH_STAGES.findIndex((s) => s.id === stage.id);
  const nextIn = daysUntilNextStage(stage, safeStreak);

  return (
    <div className="bg-gradient-to-b from-[#FFFCF0] to-white border border-amber-100 rounded-2xl px-4 py-4 text-center">
      <div className="mt-1 flex justify-center">
        <div className="scale-[1.18] origin-center">
          <GrowthCharacter stage={stage} />
        </div>
      </div>
      <p className="mt-2 text-sm font-bold text-gray-900">
        {safeStreak === 0 ? "첫 기도를 기록해보세요" : `${safeStreak}일 연속`}
      </p>
      <p className="mt-0.5 text-[11px] text-amber-700">
        {safeStreak === 0
          ? "위의 버튼을 눌러 시작해보세요"
          : nextIn === null
          ? "성장 완료"
          : `다음 성장까지 ${nextIn}일`}
      </p>
      <div className="mt-2.5 grid grid-cols-5 gap-1.5">
        {Array.from({ length: GROWTH_STAGE_TOTAL }, (_, idx) => {
          const active = stageIndex >= idx;
          return (
            <div
              key={idx}
              className={`h-1.5 rounded-full ${active ? "" : "bg-gray-100"}`}
              style={active ? { backgroundColor: GROWTH_STAGE_COLORS[idx] } : undefined}
            />
          );
        })}
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

type StrategySections = {
  summary: string[];
  approach: string;
  actions: string[];
  example: string[];
  prayerPoints: string[];
};

function parseStrategy(text: string): StrategySections {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const sections: StrategySections = {
    summary: [],
    approach: "",
    actions: [],
    example: [],
    prayerPoints: [],
  };

  let mode: "summary" | "actions" | "example" | "prayer" = "summary";

  for (const line of lines) {
    if (line === "전략 요약") continue;
    if (line.startsWith("접근 방식:")) {
      sections.approach = line.replace(/^접근 방식:\s*/, "");
      continue;
    }
    if (line === "핵심 실행") {
      mode = "actions";
      continue;
    }
    if (line === "대화 시작 예시") {
      mode = "example";
      continue;
    }
    if (line === "기도 포인트") {
      mode = "prayer";
      continue;
    }

    if (mode === "summary") {
      sections.summary.push(line);
      continue;
    }
    if (mode === "actions") {
      sections.actions.push(line.replace(/^\d+\.\s*/, ""));
      continue;
    }
    if (mode === "example") {
      sections.example.push(line.replace(/^["']|["']$/g, ""));
      continue;
    }
    if (mode === "prayer") {
      sections.prayerPoints.push(line.replace(/^-\s*/, ""));
    }
  }

  return sections;
}

function StrategyResultArea({
  isLoading,
  text,
  onRegenerate,
}: {
  isLoading: boolean;
  text: string;
  onRegenerate: () => void;
}) {
  if (!isLoading && !text) return null;

  if (isLoading) {
    return (
      <div className="bg-apolo-kakao rounded-bubble shadow-bubble px-2 inline-block">
        <LoadingDots />
      </div>
    );
  }

  const sections = parseStrategy(text);
  const parseFailed = sections.actions.length === 0 && sections.example.length === 0;

  if (parseFailed) {
    return (
      <div className="space-y-3 animate-fade-in-up">
        <textarea
          className="w-full min-h-[240px] p-4 rounded-2xl bg-apolo-kakao text-gray-900 text-[14px] leading-relaxed resize-none focus:outline-none shadow-bubble"
          value={text}
          readOnly
        />
        <div className="flex gap-2 flex-wrap">
          <RefreshButton onClick={onRegenerate} disabled={false} />
          <CopyButton text={text} />
          <ShareButton text={text} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in-up">
      {sections.approach && (
        <div className="bg-amber-50 rounded-2xl border border-amber-100 px-4 py-3">
          <p className="text-[10px] font-semibold text-amber-600 mb-0.5 uppercase tracking-wide">접근 방향</p>
          <p className="text-sm font-bold text-amber-900">{sections.approach}</p>
        </div>
      )}

      {sections.actions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3">
          <p className="text-xs font-bold text-gray-700 mb-2">이렇게 해보세요</p>
          <div className="space-y-2">
            {sections.actions.map((line, idx) => (
              <div key={idx} className="flex gap-2">
                <span className="shrink-0 w-4 h-4 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center mt-0.5">{idx + 1}</span>
                <p className="text-xs text-gray-700 leading-relaxed">{line}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {sections.example.length > 0 && (
        <div className="bg-blue-50 rounded-2xl border border-blue-100 px-4 py-3">
          <p className="text-xs font-bold text-blue-700 mb-1.5">이렇게 말해보세요</p>
          {sections.example.map((line, idx) => (
            <p key={idx} className="text-sm text-blue-900 leading-relaxed italic">&ldquo;{line}&rdquo;</p>
          ))}
        </div>
      )}

      {sections.prayerPoints.length > 0 && (
        <div className="bg-purple-50 rounded-2xl border border-purple-100 px-4 py-3">
          <p className="text-xs font-bold text-purple-700 mb-1.5">기도 제목</p>
          <div className="space-y-1.5">
            {sections.prayerPoints.map((line, idx) => (
              <p key={idx} className="text-xs text-purple-900 leading-relaxed">{line}</p>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <RefreshButton onClick={onRegenerate} disabled={isLoading} />
        <CopyButton text={text} />
        <ShareButton text={text} />
      </div>
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
  const searchParams = useSearchParams();
  const id = params.id as string;
  const { targets, loaded, prayToday, hasPrayedToday, updateStatus, removeTarget, updateTarget } = useTargets();
  const evangelism = useEvangelism();
  const invitation = useInvitation();
  const prayer = usePrayer();

  const [activeTab, setActiveTab] = useState<TabId>("prayer");
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editRelationship, setEditRelationship] = useState<TargetRelationship>("friend");
  const [editSituation, setEditSituation] = useState("");
  const [editInterest, setEditInterest] = useState<TargetInterest>("neutral");
  const [editNotes, setEditNotes] = useState("");

  // Prayer options
  const [prayerTopic, setPrayerTopic] = useState<PrayerTopic>("salvation");
  const [prayerLength, setPrayerLength] = useState<ContentLength>("medium");

  // Invite options
  const [inviteEvent, setInviteEvent] = useState("주일예배");
  const [inviteLocation, setInviteLocation] = useState("");
  const [inviteLength, setInviteLength] = useState<ContentLength>("medium");
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const target = targets.find((t) => t.id === id);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "prayer" || tabParam === "strategy" || tabParam === "invite") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const changeTab = (tab: TabId) => {
    setActiveTab(tab);
    router.replace(`/main/targets/${id}?tab=${tab}`, { scroll: false });
  };

  const moveTabBySwipe = (direction: "next" | "prev") => {
    const currentIndex = TAB_ORDER.indexOf(activeTab);
    if (currentIndex < 0) return;
    const nextIndex =
      direction === "next"
        ? Math.min(TAB_ORDER.length - 1, currentIndex + 1)
        : Math.max(0, currentIndex - 1);
    if (nextIndex === currentIndex) return;
    changeTab(TAB_ORDER[nextIndex]);
  };

  const onContentTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.changedTouches[0]?.clientX ?? null;
    touchStartYRef.current = e.changedTouches[0]?.clientY ?? null;
  };

  const onContentTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    const startX = touchStartXRef.current;
    const startY = touchStartYRef.current;
    const endX = e.changedTouches[0]?.clientX ?? null;
    const endY = e.changedTouches[0]?.clientY ?? null;
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    if (startX === null || endX === null || startY === null || endY === null) return;

    const deltaX = endX - startX;
    const deltaY = endY - startY;
    if (Math.abs(deltaX) < 42 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    moveTabBySwipe(deltaX < 0 ? "next" : "prev");
  };

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
  const prayerContextText = (target?.notes || "").trim() || (target?.situation || "").trim();

  const handlePrayer = () => {
    if (!target) return;
    prayer.generate({
      personName: target.name,
      relationship: target.relationship,
      topic: prayerTopic,
      additionalContext: prayerContextText,
      length: prayerLength,
    });
  };
  const handlePrayerRegen = () => {
    if (!target) return;
    prayer.regenerate({
      personName: target.name,
      relationship: target.relationship,
      topic: prayerTopic,
      additionalContext: prayerContextText,
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

  const openEditPanel = () => {
    setEditName(target.name);
    setEditRelationship(target.relationship);
    setEditSituation(target.situation);
    setEditInterest(target.interest);
    setEditNotes(target.notes || "");
    setIsEditing(true);
    setShowMenu(false);
  };

  const saveTargetEdit = () => {
    const name = editName.trim();
    const situation = editSituation.trim();
    if (!name || !situation) return;

    updateTarget(id, {
      name,
      relationship: editRelationship,
      situation,
      interest: editInterest,
      notes: editNotes.trim() || undefined,
    });
    setIsEditing(false);
  };

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
          <button onClick={() => setShowMenu(!showMenu)} className="text-gray-300 text-lg">⋮</button>
        </div>

        {showMenu && (
          <div className="mt-2 flex justify-end">
            <div className="flex items-center gap-2">
              <button
                onClick={openEditPanel}
                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-medium"
              >
                정보 수정
              </button>
              <button
                onClick={() => { removeTarget(id); router.push("/main/targets"); }}
                className="px-3 py-1.5 bg-red-50 text-red-500 rounded-xl text-xs font-medium"
              >
                삭제하기
              </button>
            </div>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="px-4 py-3 border-b border-gray-100 bg-amber-50/40">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-amber-700">대상자 정보 수정</p>

            <div>
              <p className="text-[11px] font-semibold text-gray-500 mb-1">이름/호칭</p>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2.5 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-apolo-yellow"
              />
            </div>

            <div>
              <p className="text-[11px] font-semibold text-gray-500 mb-1">관계</p>
              <div className="flex flex-wrap gap-1.5">
                {(Object.entries(RELATIONSHIP_CONFIG) as [TargetRelationship, { label: string }][]).map(
                  ([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setEditRelationship(key)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        editRelationship === key ? "bg-apolo-yellow text-gray-900" : "bg-white text-gray-500 border border-gray-100"
                      }`}
                    >
                      {cfg.label}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-gray-500 mb-1">상황</p>
              <input
                type="text"
                value={editSituation}
                onChange={(e) => setEditSituation(e.target.value)}
                className="w-full px-3 py-2.5 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-apolo-yellow"
              />
            </div>

            <div>
              <p className="text-[11px] font-semibold text-gray-500 mb-1">신앙 태도</p>
              <div className="flex flex-wrap gap-1.5">
                {(Object.entries(INTEREST_CONFIG) as [TargetInterest, { label: string }][]).map(
                  ([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setEditInterest(key)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        editInterest === key ? "bg-apolo-yellow text-gray-900" : "bg-white text-gray-500 border border-gray-100"
                      }`}
                    >
                      {cfg.label}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-gray-500 mb-1">메모</p>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full min-h-[66px] px-3 py-2.5 bg-white rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-apolo-yellow"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 rounded-xl bg-white text-gray-500 text-sm font-semibold border border-gray-200"
              >
                취소
              </button>
              <button
                onClick={saveTargetEdit}
                className="flex-1 py-2.5 rounded-xl bg-apolo-yellow text-gray-900 text-sm font-bold"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 상태 진행 ─────────────────────────────────── */}
      <div className="px-4 py-3">
        <div className="bg-white rounded-2xl border border-gray-100 px-3 py-3">
          <p className="text-[11px] font-semibold text-gray-500 mb-1.5">진행 상태</p>
          <select
            value={target.status}
            onChange={(e) => updateStatus(id, e.target.value as TargetStatus)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-apolo-yellow"
          >
            {STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {STATUS_CONFIG[status].label}
              </option>
            ))}
          </select>
          <div className="mt-2.5 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-apolo-yellow transition-all"
              style={{
                width: `${((currentStatusIdx + 1) / STATUS_ORDER.length) * 100}%`,
              }}
            />
          </div>
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

      {/* ─── 하단 탭: 기도문 받기 | 전도 컨설팅 | 초대메시지 생성 ───── */}
      <div className="px-4 pt-1">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-3" />
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: "prayer" as TabId, label: "기도문받기" },
              { id: "strategy" as TabId, label: "대화전략" },
              { id: "invite" as TabId, label: "초대메시지" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => changeTab(tab.id)}
              className={`min-h-[58px] px-2 rounded-2xl border font-bold text-sm transition-all flex items-center justify-center ${
                activeTab === tab.id
                  ? "bg-apolo-yellow border-apolo-yellow text-gray-900 shadow-sm"
                  : "bg-white border-gray-200 text-gray-500 active:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-gray-400 text-center">좌우로 밀어서 탭 전환</p>
      </div>

      {/* ─── 탭 콘텐츠 ──────────────────────────────────── */}
      <div
        className="px-4 py-4 flex-1 touch-pan-y"
        onTouchStart={onContentTouchStart}
        onTouchEnd={onContentTouchEnd}
      >
        {activeTab === "prayer" && (
          <div className="space-y-3 animate-tab-slide">
            {/* 기도 성장 위젯 */}
            <PrayerGrowthWidget streak={streak} />

            <p className="text-xs text-gray-400">
              주제와 길이를 선택하면 맞춤 기도문을 만들어 드립니다.
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
          <div className="space-y-3 animate-tab-slide">
            {/* 다음 단계 추천 */}
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

            <p className="text-xs text-gray-400">
              상황에 맞는 접근 방향과 대화 예시를 드립니다.
            </p>
            {!evangelism.actionPoints && !evangelism.isLoading && (
              <button
                onClick={handleStrategy}
                className="w-full py-3 rounded-2xl bg-amber-500 text-white font-bold text-sm active:bg-amber-600 transition-colors"
              >
                대화 전략 받기
              </button>
            )}
            <StrategyResultArea
              isLoading={evangelism.isLoading}
              text={evangelism.actionPoints}
              onRegenerate={handleStrategyRegen}
            />
          </div>
        )}

        {activeTab === "invite" && (
          <div className="space-y-3 animate-tab-slide">
            <p className="text-xs text-gray-400">
              카카오톡으로 보내기 좋은 초대 메시지를 만들어 드립니다.
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
