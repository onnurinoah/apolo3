"use client";

import { useState, useCallback, useEffect } from "react";
import { categories } from "@/data/categories";
import { answerStyles } from "@/data/styles";
import { useQuestionSearch } from "@/hooks/useQuestionSearch";
import { useAnswer, AnswerLength } from "@/hooks/useAnswer";
import { useFavorites } from "@/hooks/useFavorites";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { CategoryId } from "@/types/question";
import ChatBubble from "@/components/ui/ChatBubble";
import LoadingDots from "@/components/ui/LoadingDots";
import RefreshButton from "@/components/ui/RefreshButton";
import CopyButton from "@/components/ui/CopyButton";
import ShareButton from "@/components/ui/ShareButton";
import StyleBadge from "@/components/ui/StyleBadge";

interface QuestionItem {
  id: string;
  categoryId: string;
  question: string;
}

type ViewMode = "ask" | "browse";

const ANSWER_LENGTH_OPTIONS: Array<{ id: AnswerLength; label: string }> = [
  { id: "concise", label: "짧게" },
  { id: "detailed", label: "자세히" },
];

// ─── Inline-editable answer bubble ──────────────────────────
function EditableBubble({ text, onChange }: { text: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <div className="w-full">
        <textarea
          autoFocus
          className="w-full min-h-[120px] p-4 rounded-2xl bg-apolo-kakao text-gray-900 text-[15px] leading-relaxed resize-none focus:outline-none shadow-bubble"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setEditing(false)}
        />
        <p className="text-sm text-gray-400 mt-1 text-right">탭 밖을 누르면 완료</p>
      </div>
    );
  }
  return (
    <div className="w-full cursor-pointer" onClick={() => setEditing(true)}>
      <ChatBubble variant="sent">{text}</ChatBubble>
      <p className="text-sm text-gray-300 mt-1 text-right">탭하여 편집</p>
    </div>
  );
}

// ─── Answer View ─────────────────────────────────────────────
function AnswerView({ question, onBack }: { question: QuestionItem; onBack: () => void }) {
  const answer = useAnswer();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [editedText, setEditedText] = useState("");
  const [length, setLength] = useState<AnswerLength>("concise");
  const isCustom = question.id.startsWith("custom-");
  const fav = isFavorite(question.id);

  useEffect(() => {
    answer.loadAnswer(isCustom ? "" : question.id, question.question, length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id, length]);

  useEffect(() => {
    if (answer.text) setEditedText("");
  }, [answer.text, answer.styleId]);

  const displayText = editedText || answer.text;
  const catInfo = categories.find((c) => c.id === question.categoryId);

  return (
    <div className="flex flex-col h-full animate-fade-in-up">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center active:bg-gray-100">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-400 truncate">
            {isCustom ? "직접 질문" : catInfo?.nameKo}
          </p>
          <p className="text-sm font-semibold text-gray-900 truncate">{question.question}</p>
        </div>
        {!isCustom && (
          <button onClick={() => toggleFavorite(question)} className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform">
            <svg width="20" height="20" viewBox="0 0 24 24" fill={fav ? "#FFD43B" : "none"} stroke={fav ? "#FFD43B" : "#9CA3AF"} strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        )}
      </div>

      {isCustom && (
        <div className="mx-4 mt-2 px-3 py-1.5 bg-blue-50 rounded-xl">
          <p className="text-sm text-blue-600">AI가 보수 개혁주의 관점으로 답변합니다</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <ChatBubble variant="received">{question.question}</ChatBubble>
        <div className="flex flex-col items-end gap-2">
          {answer.isLoading ? (
            <div className="bg-apolo-kakao rounded-bubble shadow-bubble px-2"><LoadingDots /></div>
          ) : answer.error ? (
            <div className="chat-bubble chat-bubble-sent chat-bubble-tail-right"><p className="text-red-500 text-sm">{answer.error}</p></div>
          ) : answer.text ? (
            <EditableBubble text={displayText} onChange={setEditedText} />
          ) : null}
        </div>
      </div>

      {(answer.text || answer.isLoading) && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3">
          <div className="flex bg-gray-100 rounded-xl p-1">
            {ANSWER_LENGTH_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => setLength(option.id)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  length === option.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-400"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <StyleBadge name={answer.styleName} />
            <RefreshButton
              onClick={() =>
                answer.nextStyle(isCustom ? "" : question.id, question.question)
              }
              disabled={answer.isLoading}
            />
            <span className="text-sm text-gray-300">
              {answer.source === "database" ? "DB" : answer.source === "ai" ? "AI" : "Fallback"}
            </span>
            <span className="text-sm text-gray-300 ml-auto">
              {answerStyles.findIndex((s) => s.id === answer.styleId) + 1}/{answerStyles.length}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <CopyButton text={displayText} />
            <ShareButton text={displayText} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AI 질문 탭 (기본 화면) ─────────────────────────────────
function AskView({ onSubmit }: { onSubmit: (q: string) => void }) {
  const [text, setText] = useState("");
  const voice = useVoiceInput();
  const { favorites } = useFavorites();

  useEffect(() => {
    if (voice.transcript) setText(voice.transcript);
  }, [voice.transcript]);

  const handleSubmit = () => {
    const q = text.trim();
    if (q) {
      onSubmit(q);
      setText("");
      voice.resetTranscript();
    }
  };

  return (
    <div className="px-4 py-6 space-y-6">
      {/* 메인 입력 영역 */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-apolo-yellow-light mb-2">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7V12C3 17.55 6.84 22.74 12 24C17.16 22.74 21 17.55 21 12V7L12 2Z" fill="#FFD43B" stroke="#FFD43B" strokeWidth="1.5" />
            <path d="M9 12H15M12 9V15" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900">지금 어떤 질문을 받으셨나요?</h2>
        <p className="text-sm text-gray-400">전도 현장에서 받은 질문을 입력하면<br />바로 답변을 만들어드려요</p>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <textarea
            placeholder="예: 하나님이 정말 존재하나요?&#10;예: 진화론이 맞는 거 아니야?&#10;예: 왜 착한 사람이 고통 받아?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full min-h-[120px] p-4 pr-12 bg-gray-50 rounded-2xl text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-apolo-yellow transition-shadow"
          />
          {voice.isSupported && (
            <button
              onClick={() => voice.isListening ? voice.stopListening() : voice.startListening()}
              className={`absolute right-3 top-3 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                voice.isListening ? "bg-red-500 text-white animate-pulse" : "bg-gray-200 text-gray-500 active:bg-gray-300"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" />
                <path d="M5 10V11C5 14.866 8.134 18 12 18C15.866 18 19 14.866 19 11V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 18V22M8 22H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {voice.isListening && (
          <p className="text-sm text-red-500 animate-pulse text-center">듣고 있습니다... 말씀해주세요</p>
        )}
        {voice.error && <p className="text-sm text-red-400 text-center">{voice.error}</p>}

        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="w-full py-3.5 rounded-2xl bg-apolo-yellow text-gray-900 font-bold text-base disabled:opacity-40 active:bg-apolo-yellow-dark transition-colors shadow-sm"
        >
          답변 받기
        </button>
      </div>

      {/* 즐겨찾기 바로가기 */}
      {favorites.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-400 mb-2">즐겨찾기</p>
          <div className="space-y-2">
            {favorites.slice(0, 3).map((fav) => (
              <button
                key={fav.id}
                onClick={() => onSubmit(fav.question)}
                className="w-full text-left bg-white rounded-xl border border-gray-100 px-3 py-2.5 active:bg-gray-50 transition-colors"
              >
                <p className="text-sm text-gray-700 truncate">{fav.question}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DB 찾기 탭 ─────────────────────────────────────────────
function BrowseView({ onSelect }: { onSelect: (q: QuestionItem) => void }) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | undefined>();
  const [showAllDefault, setShowAllDefault] = useState(false);
  const { results, isLoading } = useQuestionSearch(query, selectedCategory);
  const { isFavorite } = useFavorites();
  const isDefaultListing = !query.trim() && !selectedCategory;
  const visibleResults =
    isDefaultListing && !showAllDefault ? results.slice(0, 8) : results;

  return (
    <div className="flex flex-col">
      {/* 검색바 */}
      <div className="px-4 pt-3 pb-2">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="질문 키워드를 입력하세요..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-apolo-yellow transition-shadow"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">✕</button>
          )}
        </div>
      </div>

      {/* 카테고리 칩 */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-2">
        <button
          onClick={() => {
            setSelectedCategory(undefined);
            setShowAllDefault(false);
          }}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !selectedCategory ? "bg-apolo-yellow text-gray-900" : "bg-gray-100 text-gray-500"
          }`}
        >
          전체
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
              setShowAllDefault(true);
            }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat.id ? "bg-apolo-yellow text-gray-900" : "bg-gray-100 text-gray-500"
            }`}
          >
            {cat.nameKo}
          </button>
        ))}
      </div>

      {/* 질문 목록 */}
      <div className="px-4 py-2 space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-8"><LoadingDots /></div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto mb-3" width="32" height="32" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#D1D5DB" strokeWidth="2" /><path d="M16.5 16.5L21 21" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" /></svg>
            <p className="text-sm text-gray-400">{query ? `"${query}"에 대한 질문을 찾을 수 없어요` : "질문이 없습니다"}</p>
          </div>
        ) : (
          <>
            {!query && !selectedCategory && (
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide">전체 질문 ({results.length})</p>
            )}
            {visibleResults.map((q) => {
              const cat = categories.find((c) => c.id === q.categoryId);
              const fav = isFavorite(q.id);
              return (
                <button
                  key={q.id}
                  onClick={() => onSelect(q)}
                  className="w-full text-left bg-white rounded-2xl shadow-card border border-gray-50 px-4 py-3 active:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="inline-flex items-center text-sm font-medium text-apolo-yellow-dark bg-apolo-yellow-light px-2 py-0.5 rounded-full mb-1.5">
                        {cat?.nameKo}
                      </span>
                      <p className="text-sm font-medium text-gray-900 leading-snug">{q.question}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 mt-1">
                      {fav && <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFD43B"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18L15 12L9 6" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" /></svg>
                    </div>
                  </div>
                </button>
              );
            })}
            {isDefaultListing && results.length > 8 && (
              <button
                onClick={() => setShowAllDefault((prev) => !prev)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 text-sm font-semibold text-gray-700 active:bg-gray-100"
              >
                {showAllDefault
                  ? "기본 목록으로 접기"
                  : `전체 질문 보기 (${results.length}개)`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function ApologeticsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("browse");
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionItem | null>(null);

  const handleCustomQuestion = useCallback((questionText: string) => {
    setSelectedQuestion({
      id: `custom-${Date.now()}`,
      categoryId: "custom",
      question: questionText,
    });
  }, []);

  const handleSelectQuestion = useCallback((q: QuestionItem) => {
    setSelectedQuestion(q);
  }, []);

  if (selectedQuestion) {
    return <AnswerView question={selectedQuestion} onBack={() => setSelectedQuestion(null)} />;
  }

  return (
    <div className="flex flex-col">
      {/* 모드 토글 탭 */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setViewMode("browse")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              viewMode === "browse" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"
            }`}
          >
            자주 묻는 질문
          </button>
          <button
            onClick={() => setViewMode("ask")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              viewMode === "ask" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"
            }`}
          >
            직접 질문
          </button>
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      {viewMode === "browse" ? (
        <BrowseView onSelect={handleSelectQuestion} />
      ) : (
        <AskView onSubmit={handleCustomQuestion} />
      )}
    </div>
  );
}
