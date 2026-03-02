import { NextRequest, NextResponse } from "next/server";
import { fixParticles } from "@/lib/korean";
import {
  detectRelationshipProfile,
  objective,
  PersonRelationship,
  RelationshipProfile,
  relationshipProfileLabel,
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
  relationshipLabel: string;
  profile: RelationshipProfile;
  topic: string;
  additionalContext?: string;
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

const RELATIONSHIP_LABELS: Record<string, string> = {
  family: "가족",
  parent: "부모님",
  grandparent: "조부모님",
  sibling: "형제자매",
  friend: "친구",
  colleague: "직장동료",
  coworker: "직장동료",
  acquaintance: "지인",
  neighbor: "이웃",
  "former-church-colleague": "옛 교회동료",
  self: "본인",
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

const RELATION_DB: Record<RelationshipProfile, string[]> = {
  parent: [
    "부모님 세대의 삶의 무게를 아시는 주님, 마음의 짐을 덜어 주옵소서.",
    "부모님이 외로움보다 하나님의 위로를 먼저 누리게 하옵소서.",
    "부모님의 삶의 자리에 존귀함과 평안을 더하여 주옵소서.",
  ],
  grandparent: [
    "연로한 걸음에도 주님의 평강과 힘을 더하여 주옵소서.",
    "조부모님의 하루가 두려움보다 소망으로 채워지게 하옵소서.",
    "긴 세월의 수고를 주께서 위로하시고 기쁨을 더하여 주옵소서.",
  ],
  sibling: [
    "형제자매의 관계 안에 다툼보다 이해와 배려가 자라게 하옵소서.",
    "가까운 사이일수록 상처 주지 않게 하시고 사랑으로 말하게 하옵소서.",
    "서로의 삶을 비교하기보다 서로를 세워 주는 마음을 주옵소서.",
  ],
  family: [
    "가족 안에 닫힌 마음이 열리고 화평의 대화가 회복되게 하옵소서.",
    "가족의 필요를 서로 돌아보며 사랑으로 섬기게 하옵소서.",
    "가정의 분위기가 불안보다 평안으로 채워지게 하옵소서.",
  ],
  coworker: [
    "직장 관계 속에서 지혜로운 말과 태도로 신뢰를 쌓게 하옵소서.",
    "업무의 압박 속에서도 무너지지 않는 평정을 허락해 주옵소서.",
    "직장 안에서 정직과 배려의 열매가 드러나게 하옵소서.",
  ],
  friend: [
    "친구 관계 안에 진실한 경청과 따뜻한 공감이 흐르게 하옵소서.",
    "친구의 고민을 가볍게 여기지 않고 진심으로 동행하게 하옵소서.",
    "우정의 자리에서 복음의 향기가 자연스럽게 드러나게 하옵소서.",
  ],
  acquaintance: [
    "지인의 마음 문이 서서히 열리고 신뢰가 쌓이게 하옵소서.",
    "가벼운 만남 속에서도 선한 영향력이 이어지게 하옵소서.",
    "관계가 얕아 보여도 주님이 일하시는 통로가 되게 하옵소서.",
  ],
  "former-church-colleague": [
    "옛 교회의 기억 속 상처가 있다면 주께서 부드럽게 치유해 주옵소서.",
    "다시 신앙의 자리로 한 걸음 내딛을 용기를 허락해 주옵소서.",
    "익숙했던 자리의 부담이 아닌 새로운 소망을 경험하게 하옵소서.",
  ],
  neighbor: [
    "이웃 관계 안에 경계보다 따뜻한 신뢰가 자라게 하옵소서.",
    "일상의 작은 인사와 배려가 복음의 문이 되게 하옵소서.",
    "가까이 사는 이웃에게 평안과 안식을 허락해 주옵소서.",
  ],
  self: [
    "저 자신의 마음이 먼저 주님 앞에 겸손히 낮아지게 하옵소서.",
    "조급함을 내려놓고 말씀의 인도에 순종하게 하옵소서.",
    "결심만 남지 않고 오늘의 순종으로 이어지게 하옵소서.",
  ],
  general: [
    "주님께서 이 관계의 자리에 필요한 은혜를 채워 주옵소서.",
    "보이지 않는 자리에서도 주님의 선한 손길이 머물게 하옵소서.",
    "작은 만남이 큰 위로와 회복의 통로가 되게 하옵소서.",
  ],
};

function normalizeLength(raw: unknown): PrayerLength {
  return raw === "short" || raw === "long" ? raw : "medium";
}

function cleanup(text: string): string {
  return fixParticles(text)
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function pick<T>(items: T[], seed: number): T {
  return items[Math.abs(seed) % items.length];
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
  const topic = TOPIC_LABELS[body.topic || ""] || sanitizeName(body.topic) || "삶";

  return {
    name,
    relationship,
    relationshipLabel:
      RELATIONSHIP_LABELS[relationship] || relationshipProfileLabel(profile),
    profile,
    topic,
    additionalContext: sanitizeName(body.additionalContext),
    targetRef: toReference(name, relationship),
    targetObj: objective(name, relationship),
    targetSub: subjective(name, relationship),
    targetTopic: withTopic(name, relationship),
  };
}

function shortBody(style: PrayerStyleId, ctx: PrayerContext): string[] {
  return [
    `사랑의 하나님, 오늘 ${ctx.targetObj} 위해 기도합니다.`,
    `${ctx.topic}의 자리에서 주님의 도우심을 경험하게 하옵소서.`,
    `${STYLE_TITLE[style]}의 은혜를 허락하시고 말씀으로 붙들어 주옵소서 (${STYLE_VERSE[style]}).`,
  ];
}

function mediumBody(style: PrayerStyleId, ctx: PrayerContext): string[] {
  const lines = [
    "자비로우신 하나님 아버지,",
    `오늘 ${ctx.targetObj} 올려 드리며 간구합니다.`,
    `${ctx.targetSub} ${ctx.topic}의 문제 앞에서 두려움보다 믿음을 선택하게 하옵소서.`,
    `${STYLE_TITLE[style]}의 자리에서 주님의 뜻을 보게 하시고, 말씀의 약속을 붙들게 하옵소서 (${STYLE_VERSE[style]}).`,
  ];
  if (ctx.additionalContext) {
    lines.push(`${ctx.targetTopic} 현재 ${ctx.additionalContext}의 상황을 지나고 있습니다.`);
  }
  lines.push("필요한 사람과 길을 만나게 하시고, 복음의 소망을 놓치지 않게 하옵소서.");
  return lines;
}

function longBody(style: PrayerStyleId, ctx: PrayerContext): string[] {
  const lines = [
    "신실하신 하나님 아버지,",
    `오늘도 ${ctx.targetObj} 위해 포기하지 않고 중보합니다.`,
    `${ctx.targetSub} 겪는 ${ctx.topic}의 문제를 주께서 가장 선한 길로 이끌어 주옵소서.`,
    `${STYLE_TITLE[style]}의 관점에서 필요한 깨달음과 결단을 허락해 주옵소서.`,
    `${STYLE_VERSE[style]} 말씀을 마음 깊이 새기게 하시고, 현실의 두려움을 이길 담대함을 주옵소서.`,
  ];

  if (ctx.additionalContext) {
    lines.push(`${ctx.targetTopic} 현재 ${ctx.additionalContext}의 시간을 지나고 있으니 주께서 친히 위로해 주옵소서.`);
  }

  lines.push(
    "필요한 도움의 손길을 만나게 하시고, 지치지 않도록 몸과 마음에 새 힘을 더해 주옵소서.",
    "관계의 자리마다 화평이 흐르게 하시고, 복음의 문이 자연스럽게 열리게 하옵소서.",
    "저도 조급함을 내려놓고 사랑으로 동행하게 하옵소서."
  );

  return lines;
}

function composePrayer(
  style: PrayerStyleId,
  length: PrayerLength,
  ctx: PrayerContext,
  variationIndex: number
): string {
  const relationLine = pick(RELATION_DB[ctx.profile] || RELATION_DB.general, variationIndex);

  const base =
    length === "short"
      ? shortBody(style, ctx)
      : length === "long"
      ? longBody(style, ctx)
      : mediumBody(style, ctx);

  const content = [
    ...base,
    relationLine,
    "예수님의 이름으로 기도합니다. 아멘.",
  ];

  return cleanup(content.join("\n\n"));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    personName,
    relationship,
    topic,
    additionalContext,
    variationIndex = 0,
    length,
  } = body;

  const ctx = buildContext({ personName, relationship, topic, additionalContext });
  const normalizedLength = normalizeLength(length);
  const style = STYLE_ORDER[Math.abs(Number(variationIndex) || 0) % STYLE_ORDER.length];

  const prayer = composePrayer(style, normalizedLength, ctx, variationIndex);
  return NextResponse.json({ prayer });
}
