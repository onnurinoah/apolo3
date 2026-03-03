import { NextRequest, NextResponse } from "next/server";
import {
  objective,
  PersonRelationship,
  subjective,
  toReference,
} from "@/lib/person";

type StrategyTrack =
  | "healing"
  | "crisis-care"
  | "family-discipleship"
  | "workplace-witness"
  | "intellectual"
  | "gospel-bridge"
  | "long-term"
  | "oikos";

type LineBuilder = (ctx: StrategyContext) => string;

type TrackTemplate = {
  approaches: LineBuilder[];
  actionPool: LineBuilder[];
  examplePool: LineBuilder[];
  prayerPool: LineBuilder[];
};

type StrategyContext = {
  relationshipLabel: string;
  interestLabel: string;
  situation: string;
  additionalContext?: string;
  targetName?: string;
  nm: string;
  nObj: string;
  nSub: string;
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  family: "가족",
  friend: "친구",
  colleague: "직장동료",
  acquaintance: "지인",
  neighbor: "이웃",
};

const INTEREST_LABELS: Record<string, string> = {
  positive: "긍정적",
  neutral: "중립적",
  negative: "부정적·거부감",
  curious: "호기심 있음",
  hurt: "교회 상처 경험",
};

const CRISIS_KEYWORDS = [
  "건강",
  "병",
  "암",
  "치료",
  "수술",
  "실직",
  "퇴사",
  "이직",
  "우울",
  "불안",
  "공황",
  "상실",
  "이별",
  "경제",
  "빚",
  "스트레스",
  "고립",
  "외로움",
  "가정 문제",
];

const INTELLECTUAL_KEYWORDS = [
  "과학",
  "진화",
  "증거",
  "논리",
  "철학",
  "역사",
  "증명",
  "합리",
  "의문",
  "질문",
];

function normalize(text?: string): string {
  return (text || "").toLowerCase();
}

function includesAny(source: string, keywords: string[]): boolean {
  return keywords.some((kw) => source.includes(kw));
}

function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickOne<T>(items: T[], seed: number): T {
  return items[Math.abs(seed) % items.length];
}

function pickMany<T>(items: T[], count: number, seed: number): T[] {
  if (!items.length || count <= 0) return [];
  const start = Math.abs(seed) % items.length;
  const picked: T[] = [];
  for (let i = 0; i < count; i++) {
    picked.push(items[(start + i) % items.length]);
  }
  return picked;
}

function summarizeAdditional(raw?: string): string | undefined {
  const cleaned = (raw || "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return undefined;

  const parts = cleaned
    .split(/[.!?·,]/)
    .map((v) => v.trim())
    .filter(Boolean);

  const chosen = parts[0] || cleaned;
  if (!chosen) return undefined;
  return chosen.length > 26 ? `${chosen.slice(0, 26)}...` : chosen;
}

function resolveRelationship(raw?: string): PersonRelationship {
  switch ((raw || "").trim()) {
    case "family":
    case "friend":
    case "colleague":
    case "acquaintance":
    case "neighbor":
    case "self":
    case "parent":
    case "grandparent":
    case "sibling":
    case "coworker":
    case "former-church-colleague":
      return raw as PersonRelationship;
    default:
      return "acquaintance";
  }
}

function classifyTrack(input: {
  relationship?: string;
  interest?: string;
  situation?: string;
  additionalContext?: string;
}): StrategyTrack {
  const relationship = normalize(input.relationship);
  const interest = normalize(input.interest);
  const text = `${normalize(input.situation)} ${normalize(input.additionalContext)}`;

  if (interest === "hurt") return "healing";
  if (includesAny(text, CRISIS_KEYWORDS)) return "crisis-care";
  if (relationship === "family") return "family-discipleship";
  if (relationship === "colleague") return "workplace-witness";
  if (interest === "curious" || includesAny(text, INTELLECTUAL_KEYWORDS)) return "intellectual";
  if (interest === "positive") return "gospel-bridge";
  if (interest === "negative") return "long-term";
  return "oikos";
}

const TRACK_DB: Record<StrategyTrack, TrackTemplate> = {
  healing: {
    approaches: [
      () => "상처 회복 우선 동행",
      () => "신뢰 재형성형 접근",
      () => "안전감 회복 중심",
      () => "압박 제거형 관계 전도",
    ],
    actionPool: [
      (ctx) => `${ctx.nObj} 설득하려 하기보다, 먼저 충분히 듣는 시간을 확보합니다.`,
      () => "신앙 용어를 많이 쓰기보다 공감 문장을 짧고 진실하게 반복합니다.",
      () => "첫 2~3회 만남 목표를 '신뢰 회복'으로 고정하고 성과 압박을 내려놓습니다.",
      () => "예배 초대는 바로 제안하지 말고 식사·산책 같은 가벼운 동행부터 시작합니다.",
      () => "상처 경험을 반박하지 말고, 상대 감정을 확인하는 질문으로 대화를 이어갑니다.",
      (ctx) => `${ctx.situation} 상황에서 실제로 필요한 도움 1가지를 먼저 제안합니다.`,
      () => "대화가 어렵던 날에도 짧은 안부 메시지를 유지해 관계 끊김을 막습니다.",
    ],
    examplePool: [
      () => "예전 경험이 얼마나 힘들었는지 내가 다 알 수는 없지만, 네 이야기를 가볍게 넘기고 싶지 않아.",
      () => "당장 결정을 말하려는 건 아니고, 네가 안전하다고 느끼는 대화를 하고 싶어.",
      () => "내가 먼저 듣는 사람이고 싶어. 네 속도를 존중하면서 같이 가고 싶어.",
      () => "지금은 답을 주기보다 네 마음을 이해하는 게 먼저라고 느껴.",
    ],
    prayerPool: [
      (ctx) => `${ctx.nSub} 과거 상처를 안전하게 다룰 수 있도록`,
      () => "내 조급함이 내려가고 사랑으로 동행할 수 있도록",
      () => "복음이 강요가 아니라 위로로 전달되도록",
      () => "신뢰가 회복되는 관계의 시간표를 허락해 주시도록",
      () => "말보다 태도에서 복음의 온유함이 드러나도록",
    ],
  },
  "crisis-care": {
    approaches: [
      () => "위기 동행형 접근",
      () => "공감-도움-소망 3단계",
      () => "회복 탄력성 지원형 전도",
      () => "실질 도움 우선 전략",
    ],
    actionPool: [
      () => "첫 연락은 조언보다 안부와 경청 요청으로 시작합니다.",
      (ctx) => `${ctx.situation}과 관련된 실제 도움 1가지를 오늘 제안합니다.`,
      () => "감정이 정리되는 시점에 30초~1분 짧은 기도를 조심스럽게 제안합니다.",
      () => "예배 초대는 회복 속도를 보며 소모임/짧은 방문부터 단계적으로 제안합니다.",
      () => "문제 해결을 단정하지 말고 '오늘 버틸 수 있게 돕는 것'에 초점을 둡니다.",
      () => "다음 만남 일정을 구체 날짜로 잡아 관계 공백을 최소화합니다.",
      (ctx) => `${ctx.nObj} 둘러싼 지원 자원(사람·정보·일정)을 함께 정리해 봅니다.`,
    ],
    examplePool: [
      () => "해결책을 바로 말하기보다, 네가 버겁지 않게 오늘 하루를 같이 버텨주고 싶어.",
      () => "지금은 정답보다 동행이 더 필요해 보여. 내가 곁에 있을게.",
      () => "당장 달라지지 않아도 괜찮아. 우선 네 마음이 조금이라도 가벼워지면 좋겠어.",
      () => "네가 혼자가 아니라는 걸 오늘만큼은 분명히 느끼게 해주고 싶어.",
    ],
    prayerPool: [
      (ctx) => `${ctx.nSub} 두려움보다 평안을 먼저 경험하도록`,
      () => "필요한 도움의 사람과 타이밍이 정확히 연결되도록",
      () => "낙심의 순간마다 소망의 말씀이 떠오르도록",
      () => "내가 성급한 해답보다 공감의 태도를 지키도록",
      () => "현실 문제 속에서도 하나님의 돌보심을 보게 되도록",
    ],
  },
  "family-discipleship": {
    approaches: [
      () => "가정 대화 회복형 전도",
      () => "일상 루틴형 동행",
      () => "정서 안전지대 구축형",
      () => "가족 관계 기반 접근",
    ],
    actionPool: [
      () => "가족 대화에서 비판/교정보다 공감/격려 비율을 먼저 높입니다.",
      () => "하루 1회 짧은 감사 표현으로 대화 온도를 부드럽게 바꿉니다.",
      () => "신앙 설명은 길게 말하기보다 삶의 간증 한 문장으로 시작합니다.",
      () => "가족 행사와 연결한 자연스러운 동행 초대를 준비합니다.",
      () => "기도 제안은 30초 내로 짧게 제안하고 부담을 남기지 않습니다.",
      (ctx) => `${ctx.situation} 문제를 다룰 때, 먼저 마음을 공감한 뒤 제안을 덧붙입니다.`,
      () => "한 번 거절되면 재촉하지 않고 다음 기회를 기다립니다.",
    ],
    examplePool: [
      () => "내가 먼저 잘 듣는 사람이 되고 싶어. 네 마음을 먼저 알고 싶어.",
      () => "설득하려는 마음보다 함께 버텨주는 가족이 되고 싶어.",
      () => "네가 소중하게 생각하는 걸 존중하면서 대화하고 싶어.",
      () => "부담 없는 선에서, 같이 쉬어갈 수 있는 시간을 만들어보고 싶어.",
    ],
    prayerPool: [
      () => "가정 안의 말투와 표정이 부드러워지도록",
      (ctx) => `${ctx.nSub} 복음을 거부감보다 안정감으로 경험하도록`,
      () => "가족의 대화 문이 닫히지 않고 계속 열리도록",
      () => "내 태도가 복음적 사랑으로 정돈되도록",
      () => "가족 모두의 마음에 화평이 자라도록",
    ],
  },
  "workplace-witness": {
    approaches: [
      () => "직장 신뢰 기반 전도",
      () => "실무 동행형 접근",
      () => "관계 신용 우선 전략",
      () => "작은 배려 축적형",
    ],
    actionPool: [
      () => "업무 약속 준수와 책임감으로 신뢰를 먼저 쌓습니다.",
      () => "점심/퇴근길 대화에서 삶의 고민을 먼저 듣고 공감합니다.",
      () => "신앙 대화는 상대 질문이 열릴 때 짧고 정확하게 답합니다.",
      () => "공개 권유보다 개인 메시지 초대로 부담을 낮춥니다.",
      (ctx) => `${ctx.situation} 관련해서 실질적으로 도울 수 있는 부분을 먼저 제공합니다.`,
      () => "만남 후 24시간 안에 요약 메시지로 대화를 정리합니다.",
      () => "업무 압박이 큰 주간에는 신앙 주제보다 안부와 회복을 우선합니다.",
    ],
    examplePool: [
      () => "요즘 업무 강도가 높아 보여. 내가 도울 수 있는 부분이 있으면 같이 해보자.",
      () => "나도 바쁠수록 중심을 잃기 쉬운데, 기도로 정리할 때가 많아.",
      () => "부담 주려는 건 아니고, 잠깐 쉬어갈 수 있는 자리가 있어서 떠올랐어.",
      () => "네 일정 우선으로 생각하고 있어. 편한 때에 천천히 얘기하자.",
    ],
    prayerPool: [
      (ctx) => `${ctx.nSub} 직장 압박 속에서도 마음의 쉼을 경험하도록`,
      () => "내 태도에서 신뢰와 성실의 열매가 드러나도록",
      () => "대화에 지혜와 온유를 잃지 않도록",
      () => "도움의 손길이 실제 필요와 맞닿도록",
      () => "직장 관계 속에서 복음의 문이 자연스럽게 열리도록",
    ],
  },
  intellectual: {
    approaches: [
      () => "질문 환영형 변증 전도",
      () => "핵심 논점 단계형 접근",
      () => "DB 우선 검증형 대화",
      () => "탐구 동행형 대화",
    ],
    actionPool: [
      () => "질문을 반박 대상으로 보지 말고 함께 탐구할 주제로 전환합니다.",
      () => "한 번에 논점 1개만 다뤄 대화 과부하를 막습니다.",
      () => "DB에서 유사 문항을 찾아 핵심 요약 답변부터 제시합니다.",
      () => "추가 질문이 나오면 근거 1개씩만 단계적으로 확장합니다.",
      () => "답변 후 '내가 이해한 질문 요지'를 다시 확인해 오해를 줄입니다.",
      () => "자료 제안 시 읽기 쉬운 분량부터 권해 방어감을 낮춥니다.",
      () => "결론을 강요하지 말고 다음 질문을 위한 여지를 남깁니다.",
    ],
    examplePool: [
      () => "좋은 질문이야. 오늘은 핵심 하나만 같이 정리해 볼래?",
      () => "반박하려는 의도보다, 네 질문을 정확히 이해하고 싶어.",
      () => "내가 짧게 핵심만 말해볼게. 그다음에 네 생각을 듣고 싶어.",
      () => "이 주제는 한 번에 끝나기 어려워서, 단계적으로 같이 보자.",
    ],
    prayerPool: [
      (ctx) => `${ctx.nSub} 지적 정직함 속에서 복음의 신뢰성을 보도록`,
      () => "내가 방어적 태도보다 학습형 태도를 유지하도록",
      () => "정확성과 존중이 함께 드러나는 대화가 되도록",
      () => "질문이 단순 논쟁이 아닌 진리 탐구로 이어지도록",
      () => "말의 논리뿐 아니라 삶의 진실함도 함께 전달되도록",
    ],
  },
  "gospel-bridge": {
    approaches: [
      () => "복음 브릿지 직접 전개",
      () => "간증 연결형 제시",
      () => "소망 중심 설명형",
      () => "결단 압박 최소화 접근",
    ],
    actionPool: [
      () => "복음 핵심을 짧고 선명하게(창조-타락-구속-응답) 정리합니다.",
      (ctx) => `${ctx.situation}과 복음을 연결해 '지금 필요한 소망'으로 제시합니다.`,
      () => "결단을 재촉하지 말고 한 단계 응답(함께 기도 1회 등)을 제안합니다.",
      () => "대화 후 핵심 내용을 한 문장으로 다시 확인합니다.",
      () => "상대가 이해한 내용을 먼저 말하게 해 공감대를 확인합니다.",
      () => "초대는 부담 낮은 형식으로 제안하고 선택권을 분명히 줍니다.",
      () => "다음 만남에서 이어갈 질문 1개를 남겨 연결성을 유지합니다.",
    ],
    examplePool: [
      () => "요즘 네가 찾는 답에 복음이 어떤 소망을 주는지 짧게 나눠보고 싶어.",
      () => "강요하려는 건 아니고, 내가 왜 이 소망을 붙들게 됐는지 말해볼게.",
      () => "한 번에 결론 내리기보다, 네 속도에 맞춰 같이 생각해보고 싶어.",
      () => "네 고민을 들으면서 복음이 더 현실적으로 다가왔던 순간이 있었어.",
    ],
    prayerPool: [
      (ctx) => `${ctx.nSub} 복음을 정보가 아닌 초대로 듣도록`,
      () => "내 설명이 분명하고 간결하도록",
      () => "성령께서 마음의 결단을 친히 이끌어 주시도록",
      () => "내가 결과 집착보다 사랑의 동행을 선택하도록",
      () => "복음의 소망이 현재 고민과 실제로 연결되도록",
    ],
  },
  "long-term": {
    approaches: [
      () => "장기 인내형 관계 전도",
      () => "저항 완충형 접근",
      () => "속도 존중형 동행",
      () => "관계 온도 회복형",
    ],
    actionPool: [
      () => "당장 설득 목표를 내려놓고 4주 관계 루틴을 설계합니다.",
      () => "안부-만남-후속 안부의 반복 리듬으로 관계 끊김을 막습니다.",
      () => "신앙 언급 빈도는 낮추고 삶의 성실함 증거를 높입니다.",
      () => "거절 반응 뒤 즉시 재권유하지 않고 간격을 둡니다.",
      () => "상대가 싫어하는 전도 방식은 명확히 중단합니다.",
      (ctx) => `${ctx.situation}을 다룰 때도 조언보다 경청 비율을 높입니다.`,
      () => "공통 관심사 기반 만남으로 대화 마찰을 줄입니다.",
    ],
    examplePool: [
      () => "결론을 강요하지 않고, 오래 곁에 있는 사람이 되고 싶어.",
      () => "내가 불편하게 했던 방식이 있다면 먼저 바꾸고 싶어.",
      () => "지금은 설득보다 신뢰를 회복하는 게 먼저라고 생각해.",
      () => "네가 편한 방식으로 천천히 대화해도 괜찮아.",
    ],
    prayerPool: [
      (ctx) => `${ctx.nSub} 경계심이 완만하게 풀리도록`,
      () => "내가 결과 집착 대신 충성에 집중하도록",
      () => "작은 신뢰가 꾸준히 축적되도록",
      () => "관계의 긴장이 완화되고 대화의 문이 열리도록",
      () => "내 말보다 삶의 열매가 먼저 보이도록",
    ],
  },
  oikos: {
    approaches: [
      () => "일상 접점 기반 전도",
      () => "신뢰-대화-초대 3단계",
      () => "관계 자연성 유지형",
      () => "생활 반경 동행형",
    ],
    actionPool: [
      () => "생활 반경 안에서 자연스러운 만남 빈도를 확보합니다.",
      () => "상대 필요를 파악해 작은 도움을 먼저 제공합니다.",
      (ctx) => `${ctx.situation}에 공감하는 대화로 신뢰를 쌓습니다.`,
      () => "대화가 열리면 부담 낮은 모임부터 제안합니다.",
      () => "초대 전, 모임 목적과 분위기를 1~2문장으로 명확히 안내합니다.",
      () => "만남 뒤 24시간 내 피드백 메시지로 연결성을 유지합니다.",
      () => "거절 반응이 나와도 관계 루틴을 유지해 압박감을 줄입니다.",
    ],
    examplePool: [
      () => "요즘 어떻게 지내는지 궁금했어. 네 이야기를 먼저 듣고 싶어.",
      () => "네가 편한 방식으로 대화하면서 천천히 같이 가보고 싶어.",
      () => "작게라도 도움이 필요하면 내가 함께할게.",
      () => "부담 없는 자리라서, 쉬어가는 마음으로 한번 생각해봐도 좋아.",
    ],
    prayerPool: [
      (ctx) => `${ctx.nSub} 일상 속에서 하나님의 선하심을 보도록`,
      () => "작은 접점이 복음 대화로 이어지도록",
      () => "내 관심이 진심으로 전달되도록",
      () => "관계의 문이 자연스럽게 열리도록",
      () => "돕는 손길이 꾸준히 이어지도록",
    ],
  },
};

function buildStrategy(
  track: StrategyTrack,
  variationIndex: number,
  input: {
    targetName?: string;
    relationship: PersonRelationship;
    relationshipLabel: string;
    interestLabel: string;
    situation: string;
    additionalContext?: string;
  }
): string {
  const name = input.targetName;
  const relationship = input.relationship;
  const nm = name ? toReference(name, relationship) : "대상자";
  const nObj = name ? objective(name, relationship) : "대상자를";
  const nSub = name ? subjective(name, relationship) : "대상자가";

  const ctx: StrategyContext = {
    relationshipLabel: input.relationshipLabel,
    interestLabel: input.interestLabel,
    situation: input.situation,
    additionalContext: input.additionalContext,
    targetName: input.targetName,
    nm,
    nObj,
    nSub,
  };

  const seedBase = stableHash(
    [
      track,
      input.targetName || "",
      input.relationship,
      input.situation,
      input.interestLabel,
      input.additionalContext || "",
      String(variationIndex),
    ].join("|")
  );

  const template = TRACK_DB[track];
  const approach = pickOne(template.approaches, seedBase + 3)(ctx);
  const actions = pickMany(template.actionPool, 4, seedBase + 11).map((builder) =>
    builder(ctx)
  );
  const examples = pickMany(template.examplePool, 2, seedBase + 23).map((builder) =>
    builder(ctx)
  );
  const prayers = pickMany(template.prayerPool, 3, seedBase + 37).map((builder) =>
    builder(ctx)
  );

  const contextSnippet = summarizeAdditional(input.additionalContext);
  if (contextSnippet && seedBase % 2 === 0) {
    actions[actions.length - 1] = `추가로 '${contextSnippet}' 맥락을 대화에서 한 번 더 확인해 오해를 줄입니다.`;
  }

  const baseHeader = [
    "전략 요약",
    `${input.relationshipLabel} 관계의 ${nm} · 태도: ${input.interestLabel}`,
    `현재 상황: ${input.situation}`,
    input.additionalContext ? `추가 정보: ${input.additionalContext}` : "",
  ].filter(Boolean);

  return [
    ...baseHeader,
    "",
    `접근 방식: ${approach}`,
    "핵심 실행",
    ...actions.map((line, idx) => `${idx + 1}. ${line}`),
    "대화 시작 예시",
    ...examples.map((line) => `"${line}"`),
    "기도 포인트",
    ...prayers.map((line) => `- ${line}`),
  ].join("\n");
}

function sanitizeRelation(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "관계 미입력";
  return value;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    targetName = "",
    relationship,
    situation = "",
    interest,
    additionalContext,
    variationIndex = 0,
  } = body;

  const track = classifyTrack({
    relationship,
    interest,
    situation,
    additionalContext,
  });

  const relationshipLabel =
    RELATIONSHIP_LABELS[relationship] || sanitizeRelation(relationship);
  const interestLabel = INTEREST_LABELS[interest] || "미확인";
  const relationshipValue = resolveRelationship(relationship);

  const actionPoints = buildStrategy(track, variationIndex, {
    targetName,
    relationship: relationshipValue,
    relationshipLabel,
    interestLabel,
    situation,
    additionalContext,
  });

  return NextResponse.json({ actionPoints, track });
}
