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
          className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${
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
      <svg width="92" height="92" viewBox="0 0 92 92" fill="none">
        <ellipse cx="46" cy="80" rx="21" ry="5" fill="#FFE8A1" opacity="0.55" />
        <ellipse cx="46" cy="47" rx="24" ry="31" fill="#FFF9E6" />
        <ellipse cx="46" cy="47" rx="24" ry="31" fill="url(#eggGrad)" />
        <ellipse cx="46" cy="47" rx="24" ry="31" stroke="#FACC15" strokeWidth="2.4" />
        <ellipse cx="38" cy="34" rx="9" ry="5.6" fill="white" opacity="0.58" />
        <defs>
          <linearGradient id="eggGrad" x1="30" y1="20" x2="56" y2="76" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFDF5" />
            <stop offset="0.58" stopColor="#FFF3BF" />
            <stop offset="1" stopColor="#FFE066" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (stage.id === "cracked") {
    return (
      <svg width="92" height="92" viewBox="0 0 92 92" fill="none">
        <ellipse cx="46" cy="80" rx="21" ry="5" fill="#FFE8A1" opacity="0.55" />
        <ellipse cx="46" cy="47" rx="24" ry="31" fill="url(#crackGrad)" />
        <ellipse cx="46" cy="47" rx="24" ry="31" stroke="#F4B400" strokeWidth="2.4" />
        <path d="M42 24L49 33L43 40L51 47L45 55" stroke="#EAA600" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="58" cy="29" r="2.4" fill="#FFE066" />
        <circle cx="34" cy="27" r="1.9" fill="#FFF1A8" />
        <defs>
          <linearGradient id="crackGrad" x1="28" y1="19" x2="60" y2="77" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFDF4" />
            <stop offset="0.6" stopColor="#FFE893" />
            <stop offset="1" stopColor="#FFD43B" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (stage.id === "chick") {
    return (
      <svg width="92" height="92" viewBox="0 0 92 92" fill="none">
        <ellipse cx="46" cy="80" rx="21" ry="5" fill="#FFE8A1" opacity="0.55" />
        <circle cx="46" cy="50" r="21" fill="url(#chickGrad)" />
        <ellipse cx="54" cy="54" rx="7.8" ry="5.6" fill="#FFF3BF" opacity="0.72" />
        <circle cx="38.5" cy="45" r="2.25" fill="#374151" />
        <circle cx="39.2" cy="44.2" r="0.72" fill="white" />
        <path d="M55.5 48L67 52L55.5 56V48Z" fill="#F59F00" />
        <path d="M35.5 70L39.5 63M47.5 70L51.5 63" stroke="#F59F00" strokeWidth="2.4" strokeLinecap="round" />
        <defs>
          <linearGradient id="chickGrad" x1="31" y1="31" x2="59" y2="71" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFF7CF" />
            <stop offset="0.6" stopColor="#FFE066" />
            <stop offset="1" stopColor="#FFD43B" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (stage.id === "young") {
    return (
      <svg width="92" height="92" viewBox="0 0 92 92" fill="none">
        <ellipse cx="46" cy="80" rx="22" ry="5" fill="#FFE8A1" opacity="0.55" />
        <ellipse cx="41" cy="55" rx="23" ry="16" fill="url(#youngBody)" />
        <circle cx="58" cy="41" r="11.5" fill="#FFD43B" />
        <ellipse cx="31.5" cy="55" rx="8.8" ry="5.9" fill="#FFF3BF" opacity="0.76" />
        <circle cx="55.2" cy="39.6" r="2.2" fill="#374151" />
        <circle cx="56" cy="38.9" r="0.72" fill="white" />
        <path d="M65.5 41L77 45L65.5 48.8V41Z" fill="#F59F00" />
        <path d="M34 72L38.4 64M48.3 72L52.7 64" stroke="#EA9B00" strokeWidth="2.5" strokeLinecap="round" />
        <defs>
          <linearGradient id="youngBody" x1="21" y1="41" x2="59" y2="70" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFF5C2" />
            <stop offset="0.62" stopColor="#FFD43B" />
            <stop offset="1" stopColor="#FFBF00" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  return (
    <svg width="92" height="92" viewBox="0 0 92 92" fill="none">
      <ellipse cx="46" cy="80" rx="23" ry="5.2" fill="#FFE8A1" opacity="0.55" />
      <ellipse cx="39.5" cy="56" rx="24" ry="16.5" fill="url(#adultBody)" />
      <circle cx="59" cy="40" r="12.5" fill="#FFC107" />
      <ellipse cx="29" cy="56" rx="9.4" ry="6.3" fill="#FFF3BF" opacity="0.84" />
      <path d="M64 28C61.5 24 58.2 23.3 55.9 26.1C55 23.7 53.2 23.3 51 25.2C49.7 26.2 49.6 28.3 50.4 30.7H64V28Z" fill="#FFE066" />
      <circle cx="55.8" cy="38.6" r="2.3" fill="#374151" />
      <circle cx="56.6" cy="37.8" r="0.75" fill="white" />
      <path d="M66.5 40L79 44L66.5 48V40Z" fill="#F59F00" />
      <path d="M32 72L36.6 64M47.2 72L51.8 64" stroke="#E99A00" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M17.2 56L11 51L16 58.2" stroke="#E99A00" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id="adultBody" x1="18" y1="41" x2="61" y2="72" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF3BF" />
          <stop offset="0.58" stopColor="#FFD43B" />
          <stop offset="1" stopColor="#FFB800" />
        </linearGradient>
      </defs>
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
    <div className="bg-white border border-amber-200 rounded-2xl px-4 py-4 text-center">
      <div className="mt-1 flex justify-center">
        <div className="scale-[1.08] origin-center">
          <GrowthCharacter stage={stage} />
        </div>
      </div>
      <p className="mt-2 text-base font-bold text-gray-900">
        {safeStreak === 0 ? "연속 기도 0일" : `연속 기도 ${safeStreak}일`}
      </p>
      <p className="mt-0.5 text-sm text-amber-700">
        {safeStreak === 0
          ? "오늘 첫 기록을 남겨보세요"
          : nextIn === null
          ? "최종 단계 도달"
          : `다음 단계까지 ${nextIn}일`}
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
          <p className="text-sm font-semibold text-amber-600 mb-0.5 uppercase tracking-wide">접근 방향</p>
          <p className="text-sm font-bold text-amber-900">{sections.approach}</p>
        </div>
      )}

      {sections.actions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3">
          <p className="text-sm font-bold text-gray-700 mb-2">이렇게 해보세요</p>
          <div className="space-y-2">
            {sections.actions.map((line, idx) => (
              <div key={idx} className="flex gap-2">
                <span className="shrink-0 w-4 h-4 rounded-full bg-amber-100 text-amber-700 text-sm font-bold flex items-center justify-center mt-0.5">{idx + 1}</span>
                <p className="text-sm text-gray-700 leading-relaxed">{line}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {sections.example.length > 0 && (
        <div className="bg-blue-50 rounded-2xl border border-blue-100 px-4 py-3">
          <p className="text-sm font-bold text-blue-700 mb-1.5">이렇게 말해보세요</p>
          {sections.example.map((line, idx) => (
            <p key={idx} className="text-sm text-blue-900 leading-relaxed italic">&ldquo;{line}&rdquo;</p>
          ))}
        </div>
      )}

      {sections.prayerPoints.length > 0 && (
        <div className="bg-purple-50 rounded-2xl border border-purple-100 px-4 py-3">
          <p className="text-sm font-bold text-purple-700 mb-1.5">기도 제목</p>
          <div className="space-y-1.5">
            {sections.prayerPoints.map((line, idx) => (
              <p key={idx} className="text-sm text-purple-900 leading-relaxed">{line}</p>
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
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-sm font-semibold ${cfg.color}`}>
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
  const activeTabIndex = TAB_ORDER.indexOf(activeTab);

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
            <p className="text-sm text-gray-400 truncate">
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
                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium"
              >
                정보 수정
              </button>
              <button
                onClick={() => { removeTarget(id); router.push("/main/targets"); }}
                className="px-3 py-1.5 bg-red-50 text-red-500 rounded-xl text-sm font-medium"
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
            <p className="text-sm font-semibold text-amber-700">대상자 정보 수정</p>

            <div>
              <p className="text-sm font-semibold text-gray-500 mb-1">이름/호칭</p>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2.5 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-apolo-yellow"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-500 mb-1">관계</p>
              <div className="flex flex-wrap gap-1.5">
                {(Object.entries(RELATIONSHIP_CONFIG) as [TargetRelationship, { label: string }][]).map(
                  ([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setEditRelationship(key)}
                      className={`px-2.5 py-1 rounded-full text-sm font-medium ${
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
              <p className="text-sm font-semibold text-gray-500 mb-1">상황</p>
              <input
                type="text"
                value={editSituation}
                onChange={(e) => setEditSituation(e.target.value)}
                className="w-full px-3 py-2.5 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-apolo-yellow"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-500 mb-1">신앙 태도</p>
              <div className="flex flex-wrap gap-1.5">
                {(Object.entries(INTEREST_CONFIG) as [TargetInterest, { label: string }][]).map(
                  ([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setEditInterest(key)}
                      className={`px-2.5 py-1 rounded-full text-sm font-medium ${
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
              <p className="text-sm font-semibold text-gray-500 mb-1">메모</p>
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
          <p className="text-sm font-semibold text-gray-500 mb-1.5">진행 상태</p>
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
        <div className="relative grid grid-cols-3 gap-0 rounded-2xl bg-amber-50/40 p-1 border border-amber-100">
          <div
            className="absolute top-1 bottom-1 w-[calc((100%_-_0.5rem)_/_3)] rounded-xl bg-apolo-yellow shadow-sm transition-transform duration-200"
            style={{ transform: `translateX(${Math.max(0, activeTabIndex) * 100}%)` }}
          />
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
              className={`relative z-10 min-h-[58px] px-2 rounded-xl font-extrabold text-sm transition-all flex items-center justify-center ${
                activeTab === tab.id
                  ? "text-gray-900"
                  : "text-gray-500 active:bg-white/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-sm text-gray-400 text-center">좌우로 밀어서 탭 전환</p>
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

            <p className="text-sm text-gray-400">
              주제와 길이를 선택하면 맞춤 기도문을 만들어 드립니다.
            </p>

            {/* 주제 선택 */}
            <div>
              <p className="text-sm font-semibold text-gray-500 mb-1.5">기도 주제</p>
              <div className="flex flex-wrap gap-1.5">
                {prayerTopics.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setPrayerTopic(t.id)}
                    className={`px-2.5 py-1 rounded-full text-sm font-medium transition-colors ${
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
              <p className="text-sm font-semibold text-gray-500 mb-1.5">길이</p>
              <LengthToggle value={prayerLength} onChange={setPrayerLength} />
            </div>

            {!prayer.prayer && !prayer.isLoading && (
              <div className="space-y-1.5">
                <button
                  onClick={handlePrayer}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FFD43B] to-[#FFC107] text-gray-900 font-extrabold text-sm active:brightness-95 transition-colors shadow-sm"
                >
                  기도문 받기
                </button>
                <p className="text-sm text-gray-500 text-center">생성 문구는 참고용으로 활용하세요.</p>
              </div>
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
              <p className="text-sm font-bold text-amber-800 mb-1.5">다음 단계 추천</p>
              <div className="space-y-1">
                {NEXT_ACTIONS[target.status].map((action, i) => (
                  <p key={i} className="text-sm text-amber-700">
                    {i + 1}. {action}
                  </p>
                ))}
              </div>
            </div>

            <p className="text-sm text-gray-400">
              상황에 맞는 접근 방향과 대화 예시를 드립니다.
            </p>
            {!evangelism.actionPoints && !evangelism.isLoading && (
              <button
                onClick={handleStrategy}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FFE066] to-[#FFD43B] text-gray-900 font-extrabold text-sm active:brightness-95 transition-colors shadow-sm"
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
            <p className="text-sm text-gray-400">
              카카오톡으로 보내기 좋은 초대 메시지를 만들어 드립니다.
            </p>

            {/* 모임명 */}
            <div>
              <p className="text-sm font-semibold text-gray-500 mb-1.5">모임명</p>
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
              <p className="text-sm font-semibold text-gray-500 mb-1.5">장소 <span className="font-normal text-gray-400">(선택)</span></p>
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
              <p className="text-sm font-semibold text-gray-500 mb-1.5">메시지 길이</p>
              <LengthToggle value={inviteLength} onChange={setInviteLength} />
            </div>

            {!invitation.message && !invitation.isLoading && (
              <div className="space-y-1.5">
                <button
                  onClick={handleInvite}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FFD43B] to-[#F59F00] text-gray-900 font-extrabold text-sm active:brightness-95 transition-colors shadow-sm"
                >
                  초대메시지 생성
                </button>
                <p className="text-sm text-gray-500 text-center">생성 문구는 참고용으로 활용하세요.</p>
              </div>
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
            <p className="text-sm text-gray-400 mb-1">메모</p>
            <p className="text-sm text-gray-600 leading-relaxed">{target.notes}</p>
          </div>
        </div>
      )}

      <div className="h-4" />
    </div>
  );
}
