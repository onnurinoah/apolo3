"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type GatheringConfig = {
  isOpen: boolean;
  eventName: string;
  eventDate: string | null;
};

const DEFAULT_CONFIG: GatheringConfig = {
  isOpen: false,
  eventName: "",
  eventDate: null,
};

export default function GatheringPage() {
  const [config, setConfig] = useState<GatheringConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    inviteeName: "",
    inviteCount: "1",
    phone: "",
    prayerRequest: "",
    agreedPrivacy: false,
  });

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/gathering/config", { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;
        setConfig({
          isOpen: Boolean(data.isOpen),
          eventName: data.eventName ?? "",
          eventDate: data.eventDate ?? null,
        });
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, []);

  const needsPrivacyConsent = useMemo(
    () => Boolean(form.phone.trim()),
    [form.phone]
  );

  const submit = async () => {
    setSubmitting(true);
    setMessage("");
    try {
      const res = await fetch("/api/gathering/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: config.eventName,
          eventDate: config.eventDate,
          inviteeName: form.inviteeName,
          inviteCount: Number(form.inviteCount),
          phone: form.phone,
          prayerRequest: form.prayerRequest,
          agreedPrivacy: form.agreedPrivacy,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "등록 실패");
        return;
      }

      setMessage("등록되었습니다.");
      setForm({
        inviteeName: "",
        inviteCount: "1",
        phone: "",
        prayerRequest: "",
        agreedPrivacy: false,
      });
    } catch {
      setMessage("등록 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="px-4 py-6 text-sm text-gray-500">불러오는 중...</div>;
  }

  if (!config.isOpen) {
    return (
      <div className="px-4 py-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-base font-bold text-gray-900">현재 등록이 닫혀 있습니다</h2>
          <p className="mt-2 text-sm text-gray-500">
            관리자가 집회초대 폼을 열면 이 화면에서 바로 등록할 수 있습니다.
          </p>
          <Link
            href="/main/targets"
            className="inline-flex mt-4 px-4 py-2 rounded-xl bg-apolo-yellow text-sm font-semibold text-gray-900"
          >
            내 전도로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">집회초대 등록</h2>
        <p className="text-xs text-gray-500 mt-1">
          필요한 정보만 빠르게 입력해 주세요.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            집회명
          </label>
          <input
            value={config.eventName}
            disabled
            className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-700"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            날짜
          </label>
          <input
            value={config.eventDate ?? "-"}
            disabled
            className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-700"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            초대할 사람 이름 (선택)
          </label>
          <input
            value={form.inviteeName}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, inviteeName: e.target.value }))
            }
            placeholder="예: 엄마"
            className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-apolo-yellow"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            초대희망 (명) *
          </label>
          <input
            type="number"
            min={1}
            value={form.inviteCount}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, inviteCount: e.target.value }))
            }
            className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-apolo-yellow"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            전화번호 (선택)
          </label>
          <input
            value={form.phone}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, phone: e.target.value }))
            }
            placeholder="예: 010-1234-5678"
            className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-apolo-yellow"
          />
        </div>

        {needsPrivacyConsent && (
          <label className="flex items-start gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={form.agreedPrivacy}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, agreedPrivacy: e.target.checked }))
              }
              className="mt-0.5"
            />
            <span>전화번호 입력에 따른 개인정보 수집에 동의합니다.</span>
          </label>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            기도제목 *
          </label>
          <textarea
            value={form.prayerRequest}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, prayerRequest: e.target.value }))
            }
            placeholder="기도가 필요한 내용을 간단히 적어주세요."
            className="w-full min-h-[84px] px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-apolo-yellow"
          />
        </div>

        <button
          onClick={() => void submit()}
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-apolo-yellow text-gray-900 text-sm font-bold disabled:opacity-50"
        >
          {submitting ? "등록 중..." : "등록하기"}
        </button>

        {message && <p className="text-xs text-gray-500">{message}</p>}
      </div>
    </div>
  );
}

