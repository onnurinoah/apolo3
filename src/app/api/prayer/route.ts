import { NextRequest, NextResponse } from "next/server";
import { fixParticles } from "@/lib/korean";
import { getOpenAIClient } from "@/lib/openai";
import { PRAYER_PROMPT } from "@/lib/prompts";
import {
  detectRelationshipProfile,
  objective,
  PersonRelationship,
  RelationshipProfile,
  sanitizeName,
  subjective,
  toReference,
  withTopic,
} from "@/lib/person";

type PrayerLength = "short" | "medium" | "long";

type PrayerStyleId =
  | "acts"
  | "scripture"
  | "spiritual-warfare"
  | "spirit-led"
  | "blessing"
  | "perseverance"
  | "gratitude"
  | "repentance"
  | "healing"
  | "wisdom"
  | "relationship-restoration"
  | "evangelist";

type PrayerContext = {
  name: string;
  relationship: PersonRelationship;
  profile: RelationshipProfile;
  status: string;
  topicId: string;
  topic: string;
  additionalContext?: string;
  contextFragments: string[];
  targetRef: string;
  targetObj: string;
  targetSub: string;
  targetTopic: string;
};

const TOPIC_LABELS: Record<string, string> = {
  salvation: "구원",
  health: "건강",
  family: "가정",
  work: "직장",
  peace: "마음의 평안",
  "faith-growth": "신앙성장",
  relationships: "대인관계",
  guidance: "인도하심",
  gratitude: "감사",
};

const STATUS_LABELS: Record<string, string> = {
  praying: "기도 중",
  approaching: "접근 중",
  invited: "초대함",
  attending: "참석 중",
  decided: "결신",
};

const STYLE_ORDER: PrayerStyleId[] = [
  "acts",
  "scripture",
  "spiritual-warfare",
  "spirit-led",
  "blessing",
  "perseverance",
  "gratitude",
  "repentance",
  "healing",
  "wisdom",
  "relationship-restoration",
  "evangelist",
];

const STYLE_TITLE: Record<PrayerStyleId, string> = {
  acts: "찬양과 고백, 감사와 간구",
  scripture: "말씀 선포",
  "spiritual-warfare": "영적 전쟁",
  "spirit-led": "성령 인도",
  blessing: "축복",
  perseverance: "인내 중보",
  gratitude: "감사",
  repentance: "회개",
  healing: "치유",
  wisdom: "지혜",
  "relationship-restoration": "관계 회복",
  evangelist: "전도자를 위한 기도",
};

const STYLE_VERSE: Record<PrayerStyleId, string> = {
  acts: "요한복음 14:6",
  scripture: "시편 119:105",
  "spiritual-warfare": "고린도후서 4:6",
  "spirit-led": "요한복음 16:13",
  blessing: "민수기 6:24-26",
  perseverance: "누가복음 18:1",
  gratitude: "데살로니가전서 5:18",
  repentance: "요한일서 1:9",
  healing: "이사야 53:5",
  wisdom: "야고보서 1:5",
  "relationship-restoration": "마태복음 5:9",
  evangelist: "베드로전서 3:15",
};

const STYLE_FOCUS: Record<PrayerStyleId, string[]> = {
  acts: [
    "주님의 선하심을 먼저 고백하는 마음을 잃지 않게 하옵소서.",
    "감사와 간구의 균형 안에서 믿음이 단단해지게 하옵소서.",
    "모든 기도의 시작을 주님께 향한 신뢰로 열게 하옵소서.",
  ],
  scripture: [
    "말씀이 상황 해석의 기준이 되게 하옵소서.",
    "들리는 말씀을 삶의 순종으로 이어가게 하옵소서.",
    "말씀이 마음을 밝히는 등불이 되게 하옵소서.",
  ],
  "spiritual-warfare": [
    "두려움과 정죄의 생각이 물러가고 진리로 굳게 서게 하옵소서.",
    "어둠의 압박보다 복음의 빛이 더 크게 비추게 하옵소서.",
    "시험의 때에도 믿음의 방패를 놓치지 않게 하옵소서.",
  ],
  "spirit-led": [
    "성령의 세밀한 인도하심을 분별하게 하옵소서.",
    "급한 판단보다 성령의 평안을 따라가게 하옵소서.",
    "하루의 결정마다 성령의 지혜를 구하게 하옵소서.",
  ],
  blessing: [
    "주께서 지키시고 얼굴 비추시는 복을 삶에 부어 주옵소서.",
    "복이 머무는 자리가 되게 하시고 평강을 더하여 주옵소서.",
    "하늘의 위로와 땅의 필요가 함께 채워지게 하옵소서.",
  ],
  perseverance: [
    "포기하고 싶은 순간에도 인내의 숨을 더하여 주옵소서.",
    "작은 순종이 끊기지 않고 이어지게 하옵소서.",
    "지연되는 응답 앞에서도 신뢰를 놓치지 않게 하옵소서.",
  ],
  gratitude: [
    "작은 은혜를 발견하는 눈이 열리게 하옵소서.",
    "불평보다 감사의 고백이 먼저 나오게 하옵소서.",
    "감사의 습관이 마음을 새롭게 하게 하옵소서.",
  ],
  repentance: [
    "굳어진 마음이 부드러워지고 회개의 은혜를 주옵소서.",
    "자기 의를 내려놓고 은혜 앞으로 돌아오게 하옵소서.",
    "숨긴 죄가 드러나고 용서의 기쁨을 회복하게 하옵소서.",
  ],
  healing: [
    "몸과 마음의 연약함 위에 치유의 손을 얹어 주옵소서.",
    "오래된 아픔이 회복의 과정으로 들어가게 하옵소서.",
    "지친 심령에 새 힘과 안식을 더하여 주옵소서.",
  ],
  wisdom: [
    "복잡한 선택 앞에서 지혜로운 길을 분별하게 하옵소서.",
    "성급함을 내려놓고 바른 판단을 얻게 하옵소서.",
    "말할 때와 침묵할 때를 아는 지혜를 허락하옵소서.",
  ],
  "relationship-restoration": [
    "닫힌 마음이 열리고 화해의 용기를 허락하옵소서.",
    "오해의 벽이 무너지고 진실한 대화가 시작되게 하옵소서.",
    "상처 주던 말이 회복의 말로 바뀌게 하옵소서.",
  ],
  evangelist: [
    "복음을 말할 때 담대함과 온유함을 함께 주옵소서.",
    "적절한 때에 적절한 말이 떠오르게 하옵소서.",
    "사랑 없는 열심이 아니라 사랑의 진실함으로 전하게 하옵소서.",
  ],
};

const TOPIC_DB: Record<string, string[]> = {
  salvation: [
    "복음의 핵심이 마음 깊이 새겨지게 하옵소서.",
    "예수님의 구원의 은혜가 분명하게 이해되게 하옵소서.",
    "구원이 먼 이야기가 아니라 오늘의 소망이 되게 하옵소서.",
    "복음을 듣는 귀와 믿음으로 응답하는 마음을 열어 주옵소서.",
  ],
  health: [
    "육체의 연약함을 붙드시고 회복의 길을 열어 주옵소서.",
    "치료의 과정마다 낙심하지 않도록 새 힘을 더하여 주옵소서.",
    "밤의 불안보다 주님의 평강이 먼저 임하게 하옵소서.",
    "몸의 회복과 함께 마음의 쉼도 누리게 하옵소서.",
  ],
  family: [
    "가정 안에 평화의 대화가 회복되게 하옵소서.",
    "서로를 향한 이해와 배려가 자라나게 하옵소서.",
    "가정의 무거운 분위기가 위로와 온유로 바뀌게 하옵소서.",
    "가족의 필요를 돌아보는 사랑의 손길이 이어지게 하옵소서.",
  ],
  work: [
    "직장의 부담 속에서도 중심을 잃지 않게 하옵소서.",
    "업무의 책임을 감당할 지혜와 체력을 허락하옵소서.",
    "직장 관계에서 신뢰와 정직의 열매가 나타나게 하옵소서.",
    "일의 성과보다 주님 안의 평안을 먼저 누리게 하옵소서.",
  ],
  peace: [
    "요동치는 마음에 하늘의 평강을 부어 주옵소서.",
    "염려보다 기도로 나아가는 습관을 허락하옵소서.",
    "마음의 소란이 잦아들고 주님 안에 안식하게 하옵소서.",
    "불확실한 내일 앞에서도 평안을 지키게 하옵소서.",
  ],
  "faith-growth": [
    "신앙이 감정에 머물지 않고 뿌리 내리게 하옵소서.",
    "말씀과 기도의 생활이 꾸준히 이어지게 하옵소서.",
    "믿음의 기초가 단단해지고 분별이 자라게 하옵소서.",
    "신앙의 기쁨이 다시 회복되게 하옵소서.",
  ],
  relationships: [
    "관계에서 상처보다 이해가 앞서게 하옵소서.",
    "대화가 단절되지 않고 진실하게 이어지게 하옵소서.",
    "상대를 판단하기보다 경청하는 마음을 허락하옵소서.",
    "관계의 긴장이 화해의 기회로 바뀌게 하옵소서.",
  ],
  guidance: [
    "갈림길 앞에서 주님의 인도하심을 분명히 보게 하옵소서.",
    "급한 결정 대신 주님의 때를 신뢰하게 하옵소서.",
    "작은 선택에서도 주님의 뜻을 구하게 하옵소서.",
    "길이 보이지 않을 때에도 순종의 걸음을 걷게 하옵소서.",
  ],
  gratitude: [
    "오늘 받은 은혜를 기억하며 감사하게 하옵소서.",
    "상황보다 하나님을 먼저 바라보게 하옵소서.",
    "평범한 하루 속에서도 감사의 제목을 발견하게 하옵소서.",
    "감사가 신앙의 근력이 되게 하옵소서.",
  ],
  general: [
    "오늘 필요한 은혜를 정확히 채워 주옵소서.",
    "보이지 않는 자리에서도 주님의 선한 손길이 머물게 하옵소서.",
    "작은 만남이 큰 위로의 통로가 되게 하옵소서.",
    "현실의 무게보다 주님의 소망이 앞서게 하옵소서.",
  ],
};

const RELATION_DB: Record<RelationshipProfile, string[]> = {
  parent: [
    "부모님 세대의 삶의 무게를 아시는 주님, 마음의 짐을 덜어 주옵소서.",
    "부모님이 외로움보다 하나님의 위로를 먼저 누리게 하옵소서.",
    "부모님의 삶의 자리에 존귀함과 평안을 더하여 주옵소서.",
    "부모님의 수고를 주께서 기억하시고 새 힘을 공급해 주옵소서.",
    "부모님의 마음이 닫히지 않고 소망으로 열리게 하옵소서.",
    "부모님의 하루에 은혜의 숨과 기쁨을 더하여 주옵소서.",
  ],
  grandparent: [
    "연로한 걸음에도 주님의 평강과 힘을 더하여 주옵소서.",
    "조부모님의 하루가 두려움보다 소망으로 채워지게 하옵소서.",
    "긴 세월의 수고를 주께서 위로하시고 기쁨을 더하여 주옵소서.",
    "조부모님의 일상에 따뜻한 돌봄의 손길을 보내 주옵소서.",
    "마음의 외로움이 하늘의 위로로 채워지게 하옵소서.",
    "연약한 때마다 주님이 더 가까이 동행해 주옵소서.",
  ],
  sibling: [
    "형제자매의 관계 안에 다툼보다 이해와 배려가 자라게 하옵소서.",
    "가까운 사이일수록 상처 주지 않게 하시고 사랑으로 말하게 하옵소서.",
    "서로의 삶을 비교하기보다 서로를 세워 주는 마음을 주옵소서.",
    "감정의 골이 깊어지지 않고 대화의 다리가 놓이게 하옵소서.",
    "가족 안에서 형제자매의 우정이 회복되게 하옵소서.",
    "서로를 향한 언어가 축복의 언어로 바뀌게 하옵소서.",
  ],
  family: [
    "가족 안에 닫힌 마음이 열리고 화평의 대화가 회복되게 하옵소서.",
    "가족의 필요를 서로 돌아보며 사랑으로 섬기게 하옵소서.",
    "가정의 분위기가 불안보다 평안으로 채워지게 하옵소서.",
    "가족 관계 속 오해가 풀리고 이해가 깊어지게 하옵소서.",
    "각자의 지친 마음이 주님의 위로로 새로워지게 하옵소서.",
    "가정이 다시 쉼의 공간이 되게 하옵소서.",
  ],
  coworker: [
    "직장 관계 속에서 지혜로운 말과 태도로 신뢰를 쌓게 하옵소서.",
    "업무의 압박 속에서도 무너지지 않는 평정을 허락해 주옵소서.",
    "직장 안에서 정직과 배려의 열매가 드러나게 하옵소서.",
    "경쟁보다 협력의 마음으로 관계를 세우게 하옵소서.",
    "지친 업무 가운데도 마음의 여유를 지키게 하옵소서.",
    "직장 대화 속에 은혜의 온유함이 흐르게 하옵소서.",
  ],
  friend: [
    "친구 관계 안에 진실한 경청과 따뜻한 공감이 흐르게 하옵소서.",
    "친구의 고민을 가볍게 여기지 않고 진심으로 동행하게 하옵소서.",
    "우정의 자리에서 복음의 향기가 자연스럽게 드러나게 하옵소서.",
    "친구의 상한 마음에 위로의 통로가 되게 하옵소서.",
    "가벼운 말보다 생명을 살리는 말이 나오게 하옵소서.",
    "우정이 신뢰와 소망의 통로가 되게 하옵소서.",
  ],
  acquaintance: [
    "지인의 마음 문이 서서히 열리고 신뢰가 쌓이게 하옵소서.",
    "가벼운 만남 속에서도 선한 영향력이 이어지게 하옵소서.",
    "관계가 얕아 보여도 주님이 일하시는 통로가 되게 하옵소서.",
    "짧은 인사 속에서도 진심이 전달되게 하옵소서.",
    "지인의 필요를 민감하게 볼 수 있는 눈을 허락하옵소서.",
    "작은 친절이 큰 회복의 씨앗이 되게 하옵소서.",
  ],
  "former-church-colleague": [
    "옛 교회의 기억 속 상처가 있다면 주께서 부드럽게 치유해 주옵소서.",
    "다시 신앙의 자리로 한 걸음 내딛을 용기를 허락해 주옵소서.",
    "익숙했던 자리의 부담이 아닌 새로운 소망을 경험하게 하옵소서.",
    "과거의 오해와 아픔이 은혜 안에서 풀리게 하옵소서.",
    "다시 믿음의 대화를 시작할 부드러운 문을 열어 주옵소서.",
    "정죄의 기억보다 회복의 기억이 더 크게 남게 하옵소서.",
  ],
  neighbor: [
    "이웃 관계 안에 경계보다 따뜻한 신뢰가 자라게 하옵소서.",
    "일상의 작은 인사와 배려가 복음의 문이 되게 하옵소서.",
    "가까이 사는 이웃에게 평안과 안식을 허락해 주옵소서.",
    "동네의 일상 만남이 회복의 대화로 이어지게 하옵소서.",
    "이웃의 필요를 민감하게 돌아보는 마음을 주옵소서.",
    "이웃과의 관계가 평화의 통로가 되게 하옵소서.",
  ],
  self: [
    "저 자신의 마음이 먼저 주님 앞에 겸손히 낮아지게 하옵소서.",
    "조급함을 내려놓고 말씀의 인도에 순종하게 하옵소서.",
    "결심만 남지 않고 오늘의 순종으로 이어지게 하옵소서.",
    "자기연민과 정죄에서 벗어나 은혜를 붙들게 하옵소서.",
    "사역보다 관계, 결과보다 사랑을 우선하게 하옵소서.",
    "지치지 않도록 영혼의 체력을 새롭게 하옵소서.",
  ],
  general: [
    "주님께서 이 관계의 자리에 필요한 은혜를 채워 주옵소서.",
    "보이지 않는 자리에서도 주님의 선한 손길이 머물게 하옵소서.",
    "작은 만남이 큰 위로와 회복의 통로가 되게 하옵소서.",
    "오늘 필요한 도움의 손길과 타이밍을 허락해 주옵소서.",
    "두려움보다 소망이 먼저 자라게 하옵소서.",
    "관계의 자리마다 화평의 열매를 맺게 하옵소서.",
  ],
};

const OPENING_SHORT = [
  "사랑의 하나님,",
  "은혜로우신 주님,",
  "신실하신 아버지 하나님,",
];

const OPENING_MEDIUM = [
  "자비로우신 하나님 아버지,",
  "사랑과 진리의 주님,",
  "우리의 피난처 되시는 하나님,",
  "언제나 동행하시는 아버지 하나님,",
];

const OPENING_LONG = [
  "신실하신 하나님 아버지,",
  "삶의 모든 계절을 붙드시는 하나님,",
  "연약한 자를 가까이하시는 주님,",
  "오늘도 은혜를 베푸시는 아버지 하나님,",
];

const SUPPORT_LINES = [
  "필요한 사람과 길을 만나게 하시고 지혜로운 도움을 얻게 하옵소서.",
  "낙심의 순간마다 다시 일어설 힘을 허락해 주옵소서.",
  "환경보다 하나님을 바라보는 믿음을 더하여 주옵소서.",
  "하루의 걸음이 무너지지 않도록 마음과 몸을 지켜 주옵소서.",
  "작은 순종을 이어가며 회복의 열매를 보게 하옵소서.",
];

function normalizeLength(raw: unknown): PrayerLength {
  return raw === "short" || raw === "long" ? raw : "medium";
}

function cleanup(text: string): string {
  return fixParticles(text)
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
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

function parseContextFragments(raw?: string): string[] {
  const cleaned = sanitizeName(raw)
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return [];

  return cleaned
    .split(/[.!?·,]/)
    .map((v) => v.trim())
    .filter((v) => Boolean(v) && v.length >= 3)
    .slice(0, 6);
}

function resolveRelationship(raw?: string): PersonRelationship {
  const value = sanitizeName(raw) as PersonRelationship;
  switch (value) {
    case "family":
    case "friend":
    case "colleague":
    case "acquaintance":
    case "self":
    case "neighbor":
    case "parent":
    case "grandparent":
    case "sibling":
    case "coworker":
    case "former-church-colleague":
      return value;
    default:
      return "acquaintance";
  }
}

function buildContext(body: {
  personName?: string;
  relationship?: string;
  status?: string;
  topic?: string;
  additionalContext?: string;
}): PrayerContext {
  const relationship = resolveRelationship(body.relationship);
  const name = sanitizeName(body.personName);
  const profile = detectRelationshipProfile({
    relationship,
    personName: name,
    additionalContext: body.additionalContext,
  });

  const topicId = sanitizeName(body.topic) || "general";
  const topic = TOPIC_LABELS[topicId] || sanitizeName(body.topic) || "삶";

  return {
    name,
    relationship,
    profile,
    status: STATUS_LABELS[sanitizeName(body.status)] || "기도 중",
    topicId,
    topic,
    additionalContext: sanitizeName(body.additionalContext),
    contextFragments: parseContextFragments(body.additionalContext),
    targetRef: toReference(name, relationship),
    targetObj: objective(name, relationship),
    targetSub: subjective(name, relationship),
    targetTopic: withTopic(name, relationship),
  };
}

function topicLine(ctx: PrayerContext, seed: number): string {
  const pool = TOPIC_DB[ctx.topicId] || TOPIC_DB.general;
  return pickOne(pool, seed);
}

function relationLine(ctx: PrayerContext, seed: number): string {
  const pool = RELATION_DB[ctx.profile] || RELATION_DB.general;
  return pickOne(pool, seed);
}

function focusLine(style: PrayerStyleId, seed: number): string {
  return pickOne(STYLE_FOCUS[style], seed);
}

function contextLine(ctx: PrayerContext, seed: number): string | null {
  if (!ctx.contextFragments.length) return null;
  const fragment = pickOne(ctx.contextFragments, seed);
  return `특별히 ${fragment}의 시간 속에서도 시야가 좁아지지 않게 하옵소서.`;
}

function shortBody(style: PrayerStyleId, ctx: PrayerContext, seed: number): string[] {
  const lines = [
    pickOne(OPENING_SHORT, seed),
    `오늘 ${ctx.targetObj} 위해 짧게 기도합니다.`,
    topicLine(ctx, seed + 3),
    `${STYLE_TITLE[style]}의 은혜를 허락하시고 말씀으로 붙들어 주옵소서 (${STYLE_VERSE[style]}).`,
    relationLine(ctx, seed + 7),
  ];

  if (ctx.contextFragments.length && seed % 4 === 0) {
    const line = contextLine(ctx, seed + 11);
    if (line) lines.splice(3, 0, line);
  }

  return lines;
}

function mediumBody(style: PrayerStyleId, ctx: PrayerContext, seed: number): string[] {
  const lines = [
    pickOne(OPENING_MEDIUM, seed),
    `오늘 ${ctx.targetObj} 올려 드리며 간구합니다.`,
    `${ctx.targetSub} ${ctx.topic}의 문제 앞에서 두려움보다 믿음을 선택하게 하옵소서.`,
    topicLine(ctx, seed + 5),
    focusLine(style, seed + 7),
    `${STYLE_VERSE[style]} 말씀을 붙들며 한 걸음씩 순종하게 하옵소서.`,
    pickOne(SUPPORT_LINES, seed + 9),
    relationLine(ctx, seed + 13),
  ];

  if (ctx.contextFragments.length && seed % 3 === 0) {
    const line = contextLine(ctx, seed + 15);
    if (line) lines.splice(4, 0, line);
  }

  return lines;
}

function longBody(style: PrayerStyleId, ctx: PrayerContext, seed: number): string[] {
  const lines = [
    pickOne(OPENING_LONG, seed),
    `오늘도 ${ctx.targetObj} 위해 포기하지 않고 중보합니다.`,
    `${ctx.targetSub} 겪는 ${ctx.topic}의 현실을 주께서 가장 선한 길로 이끌어 주옵소서.`,
    topicLine(ctx, seed + 3),
    focusLine(style, seed + 5),
    `${STYLE_TITLE[style]}의 관점에서 필요한 깨달음과 결단을 허락해 주옵소서.`,
    `${STYLE_VERSE[style]} 말씀을 마음 깊이 새기게 하시고, 현실의 두려움을 이길 담대함을 주옵소서.`,
    pickOne(SUPPORT_LINES, seed + 11),
    pickOne(SUPPORT_LINES, seed + 12),
    relationLine(ctx, seed + 17),
    "저도 조급함을 내려놓고 사랑으로 동행하게 하옵소서.",
  ];

  if (ctx.contextFragments.length && seed % 2 === 0) {
    const line = contextLine(ctx, seed + 19);
    if (line) lines.splice(5, 0, line);
  }

  return lines;
}

function composePrayer(
  style: PrayerStyleId,
  length: PrayerLength,
  ctx: PrayerContext,
  variationIndex: number
): string {
  const seed = stableHash(
    [
      style,
      length,
      ctx.name,
      ctx.relationship,
      ctx.topicId,
      ctx.additionalContext || "",
      String(variationIndex),
    ].join("|")
  );

  const base =
    length === "short"
      ? shortBody(style, ctx, seed)
      : length === "long"
      ? longBody(style, ctx, seed)
      : mediumBody(style, ctx, seed);

  const content = [...base, "예수님의 이름으로 기도합니다. 아멘."];
  return cleanup(content.join("\n\n"));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    personName,
    relationship,
    status,
    topic,
    additionalContext,
    variationIndex = 0,
    length,
  } = body;

  const normalizedLength = normalizeLength(length);
  const ctx = buildContext({ personName, relationship, status, topic, additionalContext });

  const styleSeed = stableHash(
    [ctx.name, ctx.relationship, ctx.topicId, ctx.additionalContext || "", String(variationIndex)].join("|")
  );
  const style = STYLE_ORDER[Math.abs(styleSeed) % STYLE_ORDER.length];
  const fallbackPrayer = composePrayer(style, normalizedLength, ctx, variationIndex);

  const referenceStyles = [
    style,
    STYLE_ORDER[(STYLE_ORDER.indexOf(style) + 3) % STYLE_ORDER.length],
    STYLE_ORDER[(STYLE_ORDER.indexOf(style) + 7) % STYLE_ORDER.length],
  ];
  const references = referenceStyles.map((s, idx) =>
    composePrayer(s, normalizedLength, ctx, variationIndex + idx + 1)
  );

  const openai = getOpenAIClient();
  if (!openai) {
    return NextResponse.json({ prayer: fallbackPrayer, source: "database" });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.42,
      max_tokens: normalizedLength === "long" ? 1150 : normalizedLength === "medium" ? 780 : 420,
      messages: [
        { role: "system", content: PRAYER_PROMPT },
        {
          role: "user",
          content: [
            "아래 DB 초안들을 참고해 자연스럽고 어색하지 않은 최종 기도문을 작성하세요.",
            "문체는 복음주의적이며 따뜻하고 진중하게 유지하세요.",
            "",
            `대상: ${ctx.targetRef}`,
            `관계: ${ctx.relationship}`,
            `현재 상태: ${ctx.status}`,
            `기도 주제: ${ctx.topic}`,
            `추가 상황: ${ctx.additionalContext || "없음"}`,
            `길이: ${normalizedLength}`,
            "",
            "DB 초안 A:",
            fallbackPrayer,
            "",
            "DB 초안 B:",
            references[0],
            "",
            "DB 초안 C:",
            references[1],
            "",
            "DB 초안 D:",
            references[2],
            "",
            "중요 규칙:",
            "1) 이름/호칭은 자연스럽게 1-2회만 사용",
            "2) 한국어 조사를 정확히",
            "3) 비슷한 문장 반복 금지",
            "4) 마지막 문장은 반드시 '예수님의 이름으로 기도합니다. 아멘.'",
          ].join("\n"),
        },
      ],
    });

    const aiPrayer = cleanup(
      completion.choices[0]?.message?.content || fallbackPrayer
    );
    const finalized = aiPrayer.endsWith("예수님의 이름으로 기도합니다. 아멘.")
      ? aiPrayer
      : cleanup(`${aiPrayer}\n\n예수님의 이름으로 기도합니다. 아멘.`);

    return NextResponse.json({ prayer: finalized, source: "ai" });
  } catch {
    return NextResponse.json({ prayer: fallbackPrayer, source: "database" });
  }
}
