"use client";

import { useState, useEffect, useCallback } from "react";

interface FavoriteQuestion {
  id: string;
  categoryId: string;
  question: string;
  savedAt: number;
}

const STORAGE_KEY = "apolo_favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteQuestion[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setFavorites(JSON.parse(raw));
    } catch {
      setFavorites([]);
    }
  }, []);

  const save = useCallback((data: FavoriteQuestion[]) => {
    setFavorites(data);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (question: { id: string; categoryId: string; question: string }) => {
      if (isFavorite(question.id)) {
        save(favorites.filter((f) => f.id !== question.id));
      } else {
        save([
          { ...question, savedAt: Date.now() },
          ...favorites,
        ]);
      }
    },
    [favorites, isFavorite, save]
  );

  return { favorites, isFavorite, toggleFavorite };
}
