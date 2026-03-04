"use client";

import { TouchEvent, useRef, useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTargets } from "@/hooks/useTargets";
import { useEvangelism } from "@/hooks/useEvangelism";
import { useInvitation } from "@/hooks/useInvitation";
import { usePrayer } from "@/hooks/usePrayer";
import { getTargetIntercedeTotal } from "@/lib/intercede";
import { prayerTopics } from "@/data/prayerTopics";
import { PrayerTopic } from "@/types/prayer";
import {
  TargetStatus,
  TargetRelationship,
  TargetInterest,
  STATUS_CONFIG,
  RELATIONSHIP_CONFIG,
  INTEREST_CONFIG,
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

function parseMemoEntries(notes?: string): string[] {
  if (!notes) return [];
  return notes
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function stripMemoStamp(line: string): string {
  return line.replace(/^\[[^\]]+\]\s*/, "").trim();
}

function makeMemoStamp(): string {
  return new Date().toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type InviteSpeechStyle = "honorific" | "casual";


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

// ─── 누적 중보 위젯 ───────────────────────────────────────
function IntercedeTotalWidget({ count }: { count: number }) {
  const safeCount = Math.max(0, count);
  const progress = Math.min(100, Math.round((safeCount / 50) * 100));

  return (
    <div className="rounded-xl bg-amber-50 px-3.5 py-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-amber-800">누적 중보</p>
        <p className="text-sm font-bold text-amber-900">{safeCount}회</p>
      </div>
      <div className="mt-2 h-1.5 w-full rounded-full bg-amber-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-apolo-yellow transition-all"
          style={{ width: `${progress}%` }}
        />
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
  const { targets, loaded, updateStatus, removeTarget, updateTarget } = useTargets();
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
  const [memoInput, setMemoInput] = useState("");

  // Prayer options
  const [prayerTopic, setPrayerTopic] = useState<PrayerTopic>("salvation");
  const [prayerLength, setPrayerLength] = useState<ContentLength>("medium");

  // Invite options
  const [inviteEvent, setInviteEvent] = useState("주일예배");
  const [inviteAddressee, setInviteAddressee] = useState("");
  const [inviteSpeechStyle, setInviteSpeechStyle] = useState<InviteSpeechStyle>("honorific");
  const [inviteChatStyleSample, setInviteChatStyleSample] = useState("");
  const [inviteLength, setInviteLength] = useState<ContentLength>("medium");
  const [intercedeTotal, setIntercedeTotal] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const target = targets.find((t) => t.id === id);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "prayer" || tabParam === "strategy" || tabParam === "invite") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!target) return;
    setMemoInput("");
    setInviteAddressee(target.name);
    setIntercedeTotal(getTargetIntercedeTotal(target.id));
  }, [target]);

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

  const memoEntries = parseMemoEntries(target?.notes);
  const memoContext = memoEntries
    .slice(0, 3)
    .map(stripMemoStamp)
    .filter(Boolean)
    .join(" · ");

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
      status: target.status,
      eventType: inviteEvent,
      addressee: inviteAddressee.trim() || target.name,
      speechStyle: inviteSpeechStyle,
      chatStyleSample: inviteChatStyleSample.trim(),
      additionalContext: `${target.situation}. ${memoContext || target.notes || ""}`,
      length: inviteLength,
    });
  };
  const handleInviteRegen = () => {
    if (!target) return;
    invitation.regenerate({
      personName: target.name,
      relationship: target.relationship,
      status: target.status,
      eventType: inviteEvent,
      addressee: inviteAddressee.trim() || target.name,
      speechStyle: inviteSpeechStyle,
      chatStyleSample: inviteChatStyleSample.trim(),
      additionalContext: `${target.situation}. ${memoContext || target.notes || ""}`,
      length: inviteLength,
    });
  };

  // 기도문 생성
  const prayerContextText = memoContext || (target?.situation || "").trim();

  const handlePrayer = () => {
    if (!target) return;
    prayer.generate({
      personName: target.name,
      relationship: target.relationship,
      topic: prayerTopic,
      status: target.status,
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
      status: target.status,
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

  const saveQuickMemo = () => {
    const text = memoInput.trim();
    if (!text) return;
    const stamped = `[${makeMemoStamp()}] ${text}`;
    const nextNotes = [stamped, ...memoEntries].slice(0, 60).join("\n");
    updateTarget(id, {
      notes: nextNotes,
    });
    setMemoInput("");
  };

  const removeMemoEntry = (index: number) => {
    const next = memoEntries.filter((_, idx) => idx !== index);
    updateTarget(id, {
      notes: next.length > 0 ? next.join("\n") : undefined,
    });
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

      <div className="px-4 pt-3 pb-2">
        <div className="rounded-2xl bg-gray-50 px-3 py-3 space-y-2.5">
          <div className="relative grid grid-cols-5 gap-0 rounded-xl bg-white border border-gray-200 p-1">
            <div
              className="absolute top-1 bottom-1 w-[calc((100%_-_0.5rem)_/_5)] rounded-lg bg-apolo-yellow transition-transform duration-200"
              style={{ transform: `translateX(${Math.max(0, currentStatusIdx) * 100}%)` }}
            />
            {STATUS_ORDER.map((status) => (
              <button
                key={status}
                onClick={() => updateStatus(id, status)}
                className={`relative z-10 min-h-[38px] px-1 text-[11px] font-bold rounded-lg transition-colors whitespace-nowrap ${
                  target.status === status ? "text-gray-900" : "text-gray-500"
                }`}
              >
                {STATUS_CONFIG[status].label}
              </button>
            ))}
          </div>
          <div className="h-1.5 w-full rounded-full bg-white overflow-hidden">
            <div
              className="h-full rounded-full bg-apolo-yellow transition-all"
              style={{
                width: `${((currentStatusIdx + 1) / STATUS_ORDER.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ─── 하단 탭: 기도문생성 | 맞춤전략 | 초대메시지 ───── */}
      <div className="px-4 pt-1">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-3" />
        <div className="relative grid grid-cols-3 gap-0 rounded-2xl bg-amber-50/40 p-1 border border-amber-100">
          <div
            className="absolute top-1 bottom-1 w-[calc((100%_-_0.5rem)_/_3)] rounded-xl bg-apolo-yellow shadow-sm transition-transform duration-200"
            style={{ transform: `translateX(${Math.max(0, activeTabIndex) * 100}%)` }}
          />
          {(
            [
              { id: "prayer" as TabId, label: "기도문생성" },
              { id: "strategy" as TabId, label: "맞춤전략" },
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
      </div>

      {/* ─── 탭 콘텐츠 ──────────────────────────────────── */}
      <div
        className="px-4 py-4 flex-1 touch-pan-y"
        onTouchStart={onContentTouchStart}
        onTouchEnd={onContentTouchEnd}
      >
        {activeTab === "prayer" && (
          <div className="space-y-3 animate-tab-slide">
            <IntercedeTotalWidget count={intercedeTotal} />

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
                  기도문 생성
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
            {!evangelism.actionPoints && !evangelism.isLoading && (
              <button
                onClick={handleStrategy}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FFE066] to-[#FFD43B] text-gray-900 font-extrabold text-sm active:brightness-95 transition-colors shadow-sm"
              >
                맞춤전략 생성
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

            {/* 호칭 */}
            <div>
              <p className="text-sm font-semibold text-gray-500 mb-1.5">호칭</p>
              <input
                type="text"
                value={inviteAddressee}
                onChange={(e) => setInviteAddressee(e.target.value)}
                placeholder="예: 근영아, 근영님, 엄마, 팀장님"
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-apolo-yellow"
              />
            </div>

            {/* 존대 여부 */}
            <div>
              <p className="text-sm font-semibold text-gray-500 mb-1.5">말투</p>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setInviteSpeechStyle("honorific")}
                  className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${
                    inviteSpeechStyle === "honorific" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"
                  }`}
                >
                  존대
                </button>
                <button
                  onClick={() => setInviteSpeechStyle("casual")}
                  className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${
                    inviteSpeechStyle === "casual" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"
                  }`}
                >
                  반말
                </button>
              </div>
            </div>

            {/* 평소 톡 말투 */}
            <div>
              <p className="text-sm font-semibold text-gray-500 mb-1.5">
                평소 카톡 말투 <span className="font-normal text-gray-400">(선택)</span>
              </p>
              <textarea
                value={inviteChatStyleSample}
                onChange={(e) => setInviteChatStyleSample(e.target.value)}
                placeholder="예: 바쁘지? 시간 괜찮으면 같이 갈래?"
                className="w-full min-h-[72px] px-4 py-2.5 bg-gray-50 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-apolo-yellow"
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
      <div className="px-4 pb-5">
        <div className="bg-gray-50 rounded-2xl px-4 py-3">
          <p className="text-sm font-semibold text-gray-600 mb-1.5">메모 (누적)</p>
          <div className="max-h-[180px] overflow-y-auto space-y-2 rounded-xl bg-white border border-gray-200 px-3 py-2.5">
            {memoEntries.length === 0 ? (
              <p className="text-sm text-gray-400">아직 저장된 메모가 없습니다.</p>
            ) : (
              memoEntries.map((entry, idx) => (
                <div key={`${entry}-${idx}`} className="flex items-start gap-2">
                  <p className="flex-1 text-sm text-gray-700 leading-relaxed break-words">
                    {entry}
                  </p>
                  <button
                    onClick={() => removeMemoEntry(idx)}
                    aria-label="메모 삭제"
                    className="mt-0.5 h-5 w-5 rounded-full text-[12px] font-semibold text-gray-300 active:bg-gray-100"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
          <textarea
            value={memoInput}
            onChange={(e) => setMemoInput(e.target.value)}
            placeholder="메모를 한 줄 추가하세요."
            className="w-full min-h-[88px] rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-apolo-yellow"
          />
          <button
            onClick={saveQuickMemo}
            className="mt-2.5 w-full rounded-xl bg-white border border-amber-200 py-2.5 text-sm font-semibold text-amber-900 active:bg-amber-50"
          >
            메모 추가
          </button>
        </div>
      </div>

      <div className="h-4" />
    </div>
  );
}
