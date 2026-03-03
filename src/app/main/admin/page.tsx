"use client";

import { useEffect, useState } from "react";

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

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [config, setConfig] = useState<GatheringConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let alive = true;

    async function boot() {
      try {
        const [meRes, cfgRes] = await Promise.all([
          fetch("/api/admin/me", { cache: "no-store" }),
          fetch("/api/gathering/config", { cache: "no-store" }),
        ]);
        const me = await meRes.json();
        const cfg = await cfgRes.json();
        if (!alive) return;
        setIsAdmin(Boolean(me.isAdmin));
        setConfig({
          isOpen: Boolean(cfg.isOpen),
          eventName: cfg.eventName ?? "",
          eventDate: cfg.eventDate ?? null,
        });
      } catch {
        if (!alive) return;
        setIsAdmin(false);
      }
    }

    void boot();
    return () => {
      alive = false;
    };
  }, []);

  const save = async (nextOpen: boolean) => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/gathering/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...config,
          isOpen: nextOpen,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "저장 실패");
        return;
      }
      setConfig(data);
      setMessage(nextOpen ? "배너를 열었습니다." : "배너를 닫았습니다.");
    } catch {
      setMessage("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (isAdmin === null) {
    return <div className="px-4 py-6 text-sm text-gray-500">관리자 확인 중...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="px-4 py-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-base font-bold text-gray-900">관리자 전용</h2>
          <p className="mt-2 text-sm text-gray-500">
            이 페이지는 관리자 이메일만 접근할 수 있습니다.
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Supabase `admin_emails` 테이블에 이메일을 등록해 주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">집회초대 폼 관리</h2>
        <p className="text-xs text-gray-500 mt-1">
          열기 시 내 전도 상단에 배너가 노출됩니다.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">
            집회명
          </label>
          <input
            value={config.eventName}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, eventName: e.target.value }))
            }
            placeholder="예: 봄집회"
            className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-apolo-yellow"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">
            날짜
          </label>
          <input
            type="date"
            value={config.eventDate ?? ""}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                eventDate: e.target.value || null,
              }))
            }
            className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-apolo-yellow"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => void save(true)}
            disabled={saving}
            className="py-2.5 rounded-xl bg-apolo-yellow text-gray-900 text-sm font-bold disabled:opacity-50"
          >
            폼 열기
          </button>
          <button
            onClick={() => void save(false)}
            disabled={saving}
            className="py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold disabled:opacity-50"
          >
            폼 닫기
          </button>
        </div>

        {message && <p className="text-xs text-gray-500">{message}</p>}
      </div>
    </div>
  );
}

