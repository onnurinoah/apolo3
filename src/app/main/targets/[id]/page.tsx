"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTargets, getPrayStreak } from "@/hooks/useTargets";
import { useEvangelism } from "@/hooks/useEvangelism";
import { useInvitation } from "@/hooks/useInvitation";
import { usePrayer } from "@/hooks/usePrayer";
import { prayerTopics } from "@/data/prayerTopics";
import { PrayerTopic } from "@/types/prayer";
import { EvangelismTarget } from "@/types/target";
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

type TabId = "prayer" | "strategy" | "invite" | "video";
type ContentLength = "short" | "medium" | "long";

const STATUS_ORDER: TargetStatus[] = ["praying", "approaching", "invited", "attending", "decided"];

const LENGTH_OPTIONS: { id: ContentLength; label: string }[] = [
  { id: "short", label: "짧게" },
  { id: "medium", label: "보통" },
  { id: "long", label: "깊게" },
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

// ─── 기도 달력 (최근 30일) ──────────────────────────────────
function PrayerCalendar({ prayerDates }: { prayerDates: string[] }) {
  const days = useMemo(() => {
    const result: { date: string; label: string; prayed: boolean; isToday: boolean }[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      result.push({
        date: dateStr,
        label: `${d.getDate()}`,
        prayed: prayerDates.includes(dateStr),
        isToday: i === 0,
      });
    }
    return result;
  }, [prayerDates]);

  return (
    <div>
      <div className="grid grid-cols-10 gap-1">
        {days.map((day) => (
          <div
            key={day.date}
            className={`w-full aspect-square rounded-lg flex items-center justify-center text-[10px] font-medium transition-colors ${
              day.prayed
                ? "bg-apolo-yellow text-gray-900"
                : day.isToday
                ? "bg-gray-100 text-gray-900 ring-1 ring-apolo-yellow"
                : "bg-gray-50 text-gray-300"
            }`}
            title={day.date}
          >
            {day.label}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-2">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-apolo-yellow" /><span className="text-[10px] text-gray-400">기도함</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-gray-50 border border-gray-200" /><span className="text-[10px] text-gray-400">미기도</span></div>
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

// ─── 추천 영상 탭 ──────────────────────────────────────────
function VideoTab({ target }: { target: EvangelismTarget }) {
  const keywords = useMemo(() => {
    const words: string[] = [];
    if (target.situation) words.push(target.situation);
    const interestMap: Record<string, string[]> = {
      positive: ["복음", "신앙 간증"],
      curious: ["기독교란", "하나님 존재"],
      neutral: ["삶의 의미", "행복"],
      negative: ["기독교 오해", "신앙 의문"],
      hurt: ["교회 상처 회복", "치유"],
    };
    words.push(...(interestMap[target.interest] || []));
    if (target.notes) {
      const noteWords = target.notes.split(/[,.\s·]+/).filter(w => w.length >= 2).slice(0, 2);
      words.push(...noteWords);
    }
    return [...new Set(words)].slice(0, 5);
  }, [target]);

  const [customKeyword, setCustomKeyword] = useState("");

  const ytUrl = (keyword: string, channel: string) =>
    `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword + " " + channel)}`;

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">
        {target.name}의 상황에 맞는 영상을 추천합니다.
      </p>

      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2">추천 키워드</p>
        <div className="flex flex-wrap gap-1.5">
          {keywords.map((kw, i) => (
            <span key={i} className="px-2.5 py-1 bg-apolo-yellow-light rounded-full text-xs font-medium text-gray-700">
              {kw}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {keywords.slice(0, 3).map((kw, i) => (
          <div key={i} className="space-y-1.5">
            <a href={ytUrl(kw, "온누리교회")} target="_blank" rel="noopener noreferrer"
               className="block bg-white rounded-xl border border-gray-100 px-4 py-3 active:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">온누리교회</p>
                  <p className="text-sm font-medium text-gray-900">&quot;{kw}&quot; 관련 영상</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M7 17L17 7M17 7H7M17 7V17" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </a>
            <a href={ytUrl(kw, "CGN TV")} target="_blank" rel="noopener noreferrer"
               className="block bg-white rounded-xl border border-gray-100 px-4 py-3 active:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">CGN TV</p>
                  <p className="text-sm font-medium text-gray-900">&quot;{kw}&quot; 관련 영상</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M7 17L17 7M17 7H7M17 7V17" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </a>
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2">직접 검색</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={customKeyword}
            onChange={(e) => setCustomKeyword(e.target.value)}
            placeholder="키워드 입력..."
            className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-apolo-yellow"
          />
          {customKeyword.trim() && (
            <div className="flex gap-1">
              <a href={ytUrl(customKeyword, "온누리교회")} target="_blank" rel="noopener noreferrer"
                 className="px-3 py-2.5 bg-apolo-yellow rounded-xl text-xs font-bold text-gray-900 active:bg-apolo-yellow-dark transition-colors whitespace-nowrap">
                온누리
              </a>
              <a href={ytUrl(customKeyword, "CGN TV")} target="_blank" rel="noopener noreferrer"
                 className="px-3 py-2.5 bg-apolo-yellow rounded-xl text-xs font-bold text-gray-900 active:bg-apolo-yellow-dark transition-colors whitespace-nowrap">
                CGN
              </a>
            </div>
          )}
        </div>
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
      relationship: target.relationship === "neighbor" ? "acquaintance" : target.relationship,
      eventType: inviteEvent,
      location: inviteLocation,
      length: inviteLength,
    });
  };
  const handleInviteRegen = () => {
    if (!target) return;
    invitation.regenerate({
      personName: target.name,
      relationship: target.relationship === "neighbor" ? "acquaintance" : target.relationship,
      eventType: inviteEvent,
      location: inviteLocation,
      length: inviteLength,
    });
  };

  // 기도문 생성
  const handlePrayer = () => {
    if (!target) return;
    prayer.generate({
      personName: target.name,
      relationship: target.relationship === "neighbor" ? "acquaintance" : target.relationship,
      topic: prayerTopic,
      additionalContext: `${target.situation}. ${target.notes || ""}`,
      length: prayerLength,
    });
  };
  const handlePrayerRegen = () => {
    if (!target) return;
    prayer.regenerate({
      personName: target.name,
      relationship: target.relationship === "neighbor" ? "acquaintance" : target.relationship,
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
        {streak > 0 && (
          <p className="text-center text-xs text-orange-600 font-semibold mt-1.5">
            {streak}일 연속 기도 중
          </p>
        )}
      </div>

      {/* ─── 기도 달력 ───────────────────────────────────── */}
      <div className="px-4 pb-4">
        <PrayerCalendar prayerDates={target.prayerDates} />
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

      {/* ─── 하단 탭: 기도문 | 전략 | 초대 | 영상 ────── */}
      <div className="px-4">
        <div className="flex bg-gray-100 rounded-xl p-1">
          {(
            [
              { id: "prayer" as TabId, label: "기도문" },
              { id: "strategy" as TabId, label: "전략" },
              { id: "invite" as TabId, label: "초대" },
              { id: "video" as TabId, label: "영상" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
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
              {target.name}을 위한 중보기도문을 생성합니다.
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
                기도문 생성하기
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
              {target.name}의 상황에 맞는 맞춤 전도 전략을 생성합니다.
            </p>
            {!evangelism.actionPoints && !evangelism.isLoading && (
              <button
                onClick={handleStrategy}
                className="w-full py-3 rounded-2xl bg-amber-500 text-white font-bold text-sm active:bg-amber-600 transition-colors"
              >
                전도 전략 생성하기
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
              {target.name}에게 보낼 카카오톡 초대 메시지를 생성합니다.
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
                초대 메시지 생성하기
              </button>
            )}
            <ResultArea
              isLoading={invitation.isLoading}
              text={invitation.message}
              onRegenerate={handleInviteRegen}
            />
          </div>
        )}

        {activeTab === "video" && <VideoTab target={target} />}
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
