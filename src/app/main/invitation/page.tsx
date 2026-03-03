"use client";

import { useState } from "react";
import Link from "next/link";
import { useInvitation } from "@/hooks/useInvitation";
import { InvitationInput, RelationshipType } from "@/types/invitation";
import LoadingDots from "@/components/ui/LoadingDots";
import RefreshButton from "@/components/ui/RefreshButton";
import CopyButton from "@/components/ui/CopyButton";
import ShareButton from "@/components/ui/ShareButton";

type MessageLength = "short" | "medium" | "long";

const RELATIONSHIP_OPTIONS: { value: RelationshipType; label: string }[] = [
  { value: "parent", label: "부모님" },
  { value: "grandparent", label: "조부모님" },
  { value: "sibling", label: "형제자매" },
  { value: "friend", label: "친구" },
  { value: "coworker", label: "직장동료" },
  { value: "acquaintance", label: "지인" },
  { value: "former-church-colleague", label: "옛 교회동료" },
  { value: "neighbor", label: "이웃" },
  { value: "family", label: "가족(기타)" },
];

const LENGTH_OPTIONS: { value: MessageLength; label: string }[] = [
  { value: "short", label: "짧게" },
  { value: "medium", label: "보통" },
  { value: "long", label: "길게" },
];

export default function InvitationPage() {
  const [form, setForm] = useState<InvitationInput>({
    personName: "",
    relationship: "friend",
    eventType: "주일예배",
    date: "",
    location: "",
    length: "medium",
  });
  const [editedMessage, setEditedMessage] = useState("");
  const { message, isLoading, generate, regenerate } = useInvitation();

  const isValid = form.eventType.trim().length > 0;

  const handleGenerate = () => {
    setEditedMessage("");
    generate(form);
  };

  const handleRegenerate = () => {
    setEditedMessage("");
    regenerate(form);
  };

  const displayMessage = editedMessage || message;

  return (
    <div className="px-4 py-4 space-y-5">
      <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3">
        <p className="text-sm text-gray-600">
          간편 생성 화면입니다. 대상자 상세에서 더 빠르게 작성할 수 있습니다.
        </p>
        <Link
          href="/main/targets"
          className="mt-2 inline-flex text-sm font-semibold text-apolo-yellow-dark"
        >
          내 전도 대상자에서 사용하기 →
        </Link>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-500 mb-1.5">
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
          <label className="block text-sm font-semibold text-gray-500 mb-1.5">
            관계
          </label>
          <select
            value={form.relationship}
            onChange={(e) =>
              setForm((f) => ({ ...f, relationship: e.target.value as RelationshipType }))
            }
            className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-apolo-yellow transition-shadow"
          >
            {RELATIONSHIP_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-500 mb-1.5">
            모임명 *
          </label>
          <input
            type="text"
            placeholder="예: 주일예배, 청년부 모임"
            value={form.eventType}
            onChange={(e) => setForm((f) => ({ ...f, eventType: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-apolo-yellow transition-shadow"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-500 mb-1.5">
            일시 (선택)
          </label>
          <input
            type="text"
            placeholder="예: 이번 주일 오전 11시"
            value={form.date || ""}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-apolo-yellow transition-shadow"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-500 mb-1.5">
            장소 (선택)
          </label>
          <input
            type="text"
            placeholder="예: 온누리교회 양재캠퍼스"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-apolo-yellow transition-shadow"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-500 mb-1.5">
            메시지 길이
          </label>
          <div className="flex gap-2">
            {LENGTH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setForm((f) => ({ ...f, length: opt.value }))}
                className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${
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
      </div>

      <button
        onClick={handleGenerate}
        disabled={!isValid || isLoading}
        className="w-full py-4 rounded-2xl bg-apolo-yellow text-gray-900 font-bold text-base disabled:opacity-40 active:bg-apolo-yellow-dark transition-colors"
      >
        {isLoading ? "생성 중..." : "초대 메시지 생성하기"}
      </button>
      <p className="text-sm text-gray-500 text-center -mt-2">
        생성 문구는 참고용으로 활용하세요.
      </p>

      {(isLoading || message) && (
        <div className="space-y-3 animate-fade-in-up">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
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
                <p className="text-sm text-gray-400 mt-1">탭하여 직접 편집 가능</p>
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
