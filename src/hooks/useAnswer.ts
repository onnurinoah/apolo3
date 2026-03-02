"use client";

import { useState, useCallback } from "react";
import { answerStyles } from "@/data/styles";

export type AnswerLength = "concise" | "detailed";

interface AnswerState {
  text: string;
  styleId: string;
  styleName: string;
  source: "database" | "ai" | "fallback";
  isLoading: boolean;
  error: string | null;
  styleIndex: number;
  length: AnswerLength;
}

export function useAnswer() {
  const [state, setState] = useState<AnswerState>({
    text: "",
    styleId: answerStyles[0].id,
    styleName: answerStyles[0].nameKo,
    source: "database",
    isLoading: false,
    error: null,
    styleIndex: 0,
    length: "concise",
  });

  const fetchAnswer = useCallback(
    async (
      questionId: string,
      questionText: string,
      styleIndex: number,
      length: AnswerLength
    ) => {
      const style = answerStyles[styleIndex];
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        styleId: style.id,
        styleName: style.nameKo,
        styleIndex,
        length,
      }));

      try {
        const res = await fetch("/api/answers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId,
            questionText,
            styleId: style.id,
            length,
          }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setState((prev) => ({
          ...prev,
          text: data.answer,
          source: data.source,
          isLoading: false,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : "오류가 발생했습니다.",
          isLoading: false,
        }));
      }
    },
    []
  );

  const nextStyle = useCallback(
    (questionId: string, questionText: string) => {
      const nextIndex = (state.styleIndex + 1) % answerStyles.length;
      fetchAnswer(questionId, questionText, nextIndex, state.length);
    },
    [state.styleIndex, state.length, fetchAnswer]
  );

  const loadAnswer = useCallback(
    (questionId: string, questionText: string, length?: AnswerLength) => {
      fetchAnswer(
        questionId,
        questionText,
        state.styleIndex,
        length || state.length
      );
    },
    [state.styleIndex, state.length, fetchAnswer]
  );

  return { ...state, loadAnswer, nextStyle };
}
