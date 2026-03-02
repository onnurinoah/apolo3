"use client";

import { useState, useCallback } from "react";
import { EvangelismInput } from "@/types/evangelism";

export function useEvangelism() {
  const [actionPoints, setActionPoints] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [variationIndex, setVariationIndex] = useState(0);

  const generate = useCallback(
    async (input: EvangelismInput, varIdx?: number) => {
      const idx = varIdx !== undefined ? varIdx : variationIndex;
      setIsLoading(true);
      try {
        const res = await fetch("/api/evangelism", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...input, variationIndex: idx }),
        });
        const data = await res.json();
        setActionPoints(data.actionPoints || "");
        setVariationIndex(idx);
      } catch {
        setActionPoints("전도 액션포인트 생성 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    },
    [variationIndex]
  );

  const regenerate = useCallback(
    (input: EvangelismInput) => {
      generate(input, variationIndex + 1);
    },
    [generate, variationIndex]
  );

  return { actionPoints, isLoading, generate, regenerate };
}
