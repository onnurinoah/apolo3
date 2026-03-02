"use client";

import { useState, useCallback } from "react";
import { PrayerInput } from "@/types/prayer";

export function usePrayer() {
  const [prayer, setPrayer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [variationIndex, setVariationIndex] = useState(0);

  const generate = useCallback(
    async (input: PrayerInput, varIdx?: number) => {
      const idx = varIdx !== undefined ? varIdx : variationIndex;
      setIsLoading(true);
      try {
        const res = await fetch("/api/prayer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...input, variationIndex: idx }),
        });
        const data = await res.json();
        setPrayer(data.prayer || "");
        setVariationIndex(idx);
      } catch {
        setPrayer("기도문 생성 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    },
    [variationIndex]
  );

  const regenerate = useCallback(
    (input: PrayerInput) => {
      generate(input, variationIndex + 1);
    },
    [generate, variationIndex]
  );

  return { prayer, isLoading, generate, regenerate };
}
