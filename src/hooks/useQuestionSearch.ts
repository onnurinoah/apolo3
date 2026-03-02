"use client";

import { useState, useEffect, useCallback } from "react";
import { CategoryId } from "@/types/question";

interface SearchResult {
  id: string;
  categoryId: string;
  question: string;
}

export function useQuestionSearch(query: string, categoryId?: CategoryId) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const search = useCallback(async (q: string, cat?: CategoryId) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (cat) params.set("category", cat);
      params.set("limit", "200");

      const res = await fetch(`/api/questions?${params.toString()}`);
      const data = await res.json();
      setResults(data.questions || []);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query, categoryId);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, categoryId, search]);

  // Initial load (all questions)
  useEffect(() => {
    search("", categoryId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { results, isLoading };
}
