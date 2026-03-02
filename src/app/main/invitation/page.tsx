"use client";

import { useState, useMemo } from "react";
import { useInvitation } from "@/hooks/useInvitation";
import { InvitationInput, RelationshipType } from "@/types/invitation";
import LoadingDots from "@/components/ui/LoadingDots";
import RefreshButton from "@/components/ui/RefreshButton";
import CopyButton from "@/components/ui/CopyButton";
import ShareButton from "@/components/ui/ShareButton";

function getUpcomingSundays(count: number): { label: string; value: string }[] {
  const sundays: { label: string; value: string }[] = [];
  const today = new Date();
  const day = today.getDay();
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + (day === 0 ? 7 : 7 - day));
  for (let i = 0; i < count; i++) {
    const d = new Date(nextSunday);
    d.setDate(nextSunday.getDate() + i * 7);
    const m = d.getMonth() + 1;
    const dd = d.getDate();
    sundays.push({ label: `${m}월 ${dd}일 주일`, value: `${m}월 ${dd}일 주일` });
  }
  return sundays;
}

const RELATIONSHIP_OPTIONS: { value: RelationshipType; label: string }[] = [
  { value: "family", label: "👨‍👩‍👧 가족" },
  { value: "friend", label: "😊 친구" },
  { value: "colleague", label: "💼 직장동료" },
  { value: "acquaintance", label: "🤝 지인" },
];

export default function InvitationPage() {
  const [form, setForm] = useState<InvitationInput>({
    personName: "",
    relationship: "friend",
    eventType: "",
    date: "",
    location: "",
  });
  const [customDate, setCustomDate] = useState("");
  const [editedMessage, setEditedMessage] = useState("");
  const { message, isLoading, generate, regenerate } = useInvitation();

  const sundays = useMemo(() => getUpcomingSundays(4), []);

  const effectiveDate = form.date === "__custom__" ? customDate : form.date;
  const isValid = form.personName && form.relationship && form.eventType && effectiveDate;

  const handleGenerate = () => {
    setEditedMessage("");
    generate({ ...form, date: effectiveDate });
  };

  const handleRegenerate = () => {
    setEditedMessage("");
    regenerate({ ...form, date: effectiveDate });
  };

  const displayMessage = editedMessage || message;

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Header */}
      <div className="bg-apolo-yellow-light rounded-2xl px-4 py-3">
        <p className="text-sm text-gray-700">
          전도 대상자에게 보낼 카카오톡 초대 메시지를 만들어드립니다. ✉️
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Person name */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            이름 *
          </label>
          <input
            type="text"
            placeholder="예: 홍길동"
            value={form.personName}
            onChange={(e) => setForm((f) => ({ ...f, personName: e.target.value }))}
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

        {/* Event name - text only */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            모임명 *
          </label>
          <input
            type="text"
            placeholder="예: 주일예배, 부활절 특별예배, 청년부 모임..."
            value={form.eventType}
            onChange={(e) => setForm((f) => ({ ...f, eventType: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-apolo-yellow transition-shadow"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            날짜 *
          </label>
          <select
            value={form.date}
            onChange={(e) => {
              setForm((f) => ({ ...f, date: e.target.value }));
              if (e.target.value !== "__custom__") setCustomDate("");
            }}
            className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-apolo-yellow transition-shadow appearance-none"
          >
            <option value="">날짜를 선택하세요</option>
            {sundays.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
            <option value="__custom__">직접 입력</option>
          </select>
          {form.date === "__custom__" && (
            <input
              type="text"
              placeholder="예: 4월 20일 오전 11시"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="w-full mt-2 px-4 py-3 bg-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-apolo-yellow transition-shadow"
            />
          )}
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            장소 (선택)
          </label>
          <input
            type="text"
            placeholder="예: 온누리교회 본당"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-apolo-yellow transition-shadow"
          />
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!isValid || isLoading}
        className="w-full py-4 rounded-2xl bg-apolo-yellow text-gray-900 font-bold text-base disabled:opacity-40 active:bg-apolo-yellow-dark transition-colors"
      >
        {isLoading ? "생성 중..." : "초대 메시지 생성하기 ✉️"}
      </button>

      {/* Result */}
      {(isLoading || message) && (
        <div className="space-y-3 animate-fade-in-up">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              생성된 초대 메시지
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
                  className="w-full min-h-[160px] p-4 rounded-2xl bg-apolo-kakao text-gray-900 text-[15px] leading-relaxed resize-none focus:outline-none shadow-bubble"
                  value={displayMessage}
                  onChange={(e) => setEditedMessage(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">탭하여 직접 편집 가능</p>
              </>
            )}
          </div>

          {!isLoading && message && (
            <div className="flex gap-2 flex-wrap">
              <CopyButton text={displayMessage} />
              <ShareButton text={displayMessage} />
            </div>
          )}
        </div>
      )}

      <div className="h-4" />
    </div>
  );
}
