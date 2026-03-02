"use client";

import { useState, useCallback } from "react";
import { InvitationInput } from "@/types/invitation";

export function useInvitation() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [variationIndex, setVariationIndex] = useState(0);

  const generate = useCallback(
    async (input: InvitationInput, varIdx?: number) => {
      const idx = varIdx !== undefined ? varIdx : variationIndex;
      setIsLoading(true);
      try {
        const res = await fetch("/api/invitation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...input, variationIndex: idx }),
        });
        const data = await res.json();
        setMessage(data.message || "");
        setVariationIndex(idx);
      } catch {
        setMessage("초대 메시지 생성 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    },
    [variationIndex]
  );

  const regenerate = useCallback(
    (input: InvitationInput) => {
      generate(input, variationIndex + 1);
    },
    [generate, variationIndex]
  );

  return { message, isLoading, generate, regenerate };
}
