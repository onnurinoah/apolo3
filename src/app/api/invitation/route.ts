import { NextRequest, NextResponse } from "next/server";
import { fixParticles } from "@/lib/korean";
import {
  detectRelationshipProfile,
  eventMeta,
  PersonRelationship,
  RelationshipProfile,
  relationshipProfileLabel,
  sanitizeName,
  toAddressee,
  toReference,
} from "@/lib/person";

type InvitationLength = "short" | "medium" | "long";

type TemplateContext = {
  addressee: string;
  person: string;
  profile: RelationshipProfile;
  relationshipLabel: string;
  eventType: string;
  date?: string;
  location?: string;
  additionalContext?: string;
  meta: string;
};

type LineBuilder = (ctx: TemplateContext) => string;

type ProfileTone = {
  opening: LineBuilder[];
  reason: LineBuilder[];
  reassure: LineBuilder[];
  ask: LineBuilder[];
  closing: LineBuilder[];
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
};

const PROFILE_EMOJIS: Partial<Record<RelationshipProfile, string[]>> = {
  parent: ["🙂", "🙏"],
  grandparent: ["🙏", "🙂"],
  sibling: ["🙂", "😊"],
  family: ["😊", "💛"],
  friend: ["😊", "🙂", "✨"],
  coworker: ["🙂"],
  acquaintance: ["🙂"],
  "former-church-colleague": ["🙏", "🙂"],
  neighbor: ["🙂"],
  self: ["🙏", "🙂"],
  general: ["🙂"],
};

const TONES: Partial<Record<RelationshipProfile, ProfileTone>> = {
  parent: {
    opening: [
      (ctx) => `${ctx.addressee}, 늘 감사한 마음으로 연락드려요.`,
      (ctx) => `${ctx.addressee}, 이번에는 제가 소중히 여기는 시간을 함께 나누고 싶어 연락드렸어요.`,
    ],
    reason: [
      (ctx) => `이번 ${ctx.eventType}는 마음을 차분히 정리하고 위로를 얻기 좋은 자리예요.`,
      (ctx) => `이번 ${ctx.eventType}에서 삶을 돌아보고 마음에 힘을 얻는 시간을 함께하면 좋겠어요.`,
    ],
    reassure: [
      () => "부담 없이 앉아서 듣기만 하셔도 괜찮아요.",
      () => "처음부터 끝까지 제가 옆에서 안내해 드릴게요.",
    ],
    ask: [
      () => "괜찮으시면 제가 모시고 함께 다녀오고 싶어요.",
      () => "시간이 되시면 이번에 함께해 주시면 좋겠습니다.",
    ],
    closing: [
      () => "편하실 때 알려주세요.",
      () => "부담 없이 생각해 보시고 답 주시면 감사하겠습니다.",
    ],
  },
  grandparent: {
    opening: [
      (ctx) => `${ctx.addressee}, 안부 드립니다.`,
      (ctx) => `${ctx.addressee}, 평안하신지요.`,
    ],
    reason: [
      (ctx) => `이번 ${ctx.eventType}에 조용히 함께하면 좋겠다는 마음으로 연락드렸습니다.`,
      (ctx) => `이번 ${ctx.eventType}는 편안하게 참석하실 수 있는 자리라 조심스럽게 모시고 싶습니다.`,
    ],
    reassure: [
      () => "오셔서 쉬어가시듯 편하게 계시면 됩니다.",
      () => "불편하시지 않도록 제가 곁에서 잘 도와드리겠습니다.",
    ],
    ask: [
      () => "시간 괜찮으시면 함께해 주실 수 있을까요.",
      () => "이번 기회에 함께 자리해 주시면 감사하겠습니다.",
    ],
    closing: [
      () => "무리하지 마시고 괜찮으실 때 말씀 주세요.",
      () => "편하신 답변 기다리겠습니다.",
    ],
  },
  sibling: {
    opening: [
      (ctx) => `${ctx.addressee}, 요즘 어때?`,
      (ctx) => `${ctx.addressee}, 문득 생각나서 연락했어.`,
    ],
    reason: [
      (ctx) => `이번 ${ctx.eventType}에 같이 가면 서로 좋은 시간 보낼 수 있을 것 같아.`,
      (ctx) => `이번 ${ctx.eventType}는 편하게 참여할 수 있는 자리라 같이 가자고 제안해 보고 싶었어.`,
    ],
    reassure: [
      () => "어색하면 중간에 잠깐 나와도 괜찮아.",
      () => "부담 없이 와서 분위기만 보고 가도 돼.",
    ],
    ask: [
      () => "괜찮으면 이번에 같이 가자.",
      () => "시간 되면 같이 가줄래?",
    ],
    closing: [
      () => "편하게 답 줘.",
      () => "부담 갖지 말고 생각해 보고 알려줘.",
    ],
  },
  friend: {
    opening: [
      (ctx) => `${ctx.addressee}, 잘 지내지?`,
      (ctx) => `${ctx.addressee}, 오랜만에 안부 남겨.`,
    ],
    reason: [
      (ctx) => `이번 ${ctx.eventType}가 있는데, 생각보다 편하고 따뜻한 분위기라 너랑 같이 가고 싶었어.`,
      (ctx) => `이번 ${ctx.eventType}는 처음 가는 사람도 부담 없는 자리라 한번 같이 가보면 좋겠어.`,
    ],
    reassure: [
      () => "어색하면 내가 옆에서 같이 있어 줄게.",
      () => "뭔가를 강요하는 자리가 아니라 편히 쉬어가는 시간이야.",
    ],
    ask: [
      () => "시간 되면 이번에 같이 가볼래?",
      () => "괜찮으면 한번만 같이 가주면 좋겠어.",
    ],
    closing: [
      () => "부담 없이 생각해 보고 답 줘.",
      () => "편하게 결정해 줘도 돼.",
    ],
  },
  coworker: {
    opening: [
      (ctx) => `${ctx.addressee}, 안녕하세요.`,
      (ctx) => `${ctx.addressee}, 업무로 바쁘실 텐데 갑작스러운 연락 드립니다.`,
    ],
    reason: [
      (ctx) => `이번 ${ctx.eventType}에 부담 없이 참여할 수 있는 시간이 있어 조심스럽게 초대드립니다.`,
      (ctx) => `이번 ${ctx.eventType}는 조용히 쉬어가며 생각을 정리하기 좋은 자리라 안내드리고 싶었습니다.`,
    ],
    reassure: [
      () => "처음 오셔도 불편하지 않도록 제가 함께하겠습니다.",
      () => "잠시만 머무르셔도 괜찮고, 편하신 범위에서 참여하시면 됩니다.",
    ],
    ask: [
      () => "시간이 허락되시면 함께해 주실 수 있을까요.",
      () => "괜찮으시면 이번에 함께 자리해 주시면 감사하겠습니다.",
    ],
    closing: [
      () => "부담 없이 검토해 보시고 편하실 때 알려주세요.",
      () => "답변은 편하실 때 주셔도 됩니다.",
    ],
  },
  acquaintance: {
    opening: [
      (ctx) => `${ctx.addressee}, 안녕하세요.`,
      (ctx) => `${ctx.addressee}, 평안하신지요.`,
    ],
    reason: [
      (ctx) => `이번 ${ctx.eventType}가 있어 조심스럽게 초대드리고 싶었습니다.`,
      (ctx) => `이번 ${ctx.eventType}는 부담 없이 참여할 수 있는 모임이라 알려드립니다.`,
    ],
    reassure: [
      () => "강요 없이 편하게 참여하실 수 있는 자리입니다.",
      () => "분위기만 보고 가셔도 괜찮습니다.",
    ],
    ask: [
      () => "가능하시면 함께해 보시겠어요?",
      () => "시간이 맞으시면 한번 들러 주시면 좋겠습니다.",
    ],
    closing: [
      () => "편하게 생각해 보시고 알려주세요.",
      () => "답변은 부담 없이 주시면 됩니다.",
    ],
  },
  "former-church-colleague": {
    opening: [
      (ctx) => `${ctx.addressee}, 오랜만에 안부드립니다.`,
      (ctx) => `${ctx.addressee}, 예전에 함께 예배드리던 시간이 떠올라 연락드렸습니다.`,
    ],
    reason: [
      (ctx) => `이번 ${ctx.eventType}에 함께하면 좋겠다는 마음이 들어 조심스럽게 초대드립니다.`,
      (ctx) => `이번 ${ctx.eventType}는 다시 가볍게 발걸음을 옮기기 좋은 자리라 생각되어 안내드립니다.`,
    ],
    reassure: [
      () => "편하게 오셔서 분위기만 느끼고 가셔도 충분합니다.",
      () => "부담스럽지 않게 제가 곁에서 조용히 도와드리겠습니다.",
    ],
    ask: [
      () => "괜찮으시면 이번에 함께하실 수 있을까요.",
      () => "시간이 되시면 함께 자리해 주시면 반가울 것 같습니다.",
    ],
    closing: [
      () => "편하실 때 답변 주시면 감사하겠습니다.",
      () => "부담 없이 생각해 보시고 알려주세요.",
    ],
  },
  neighbor: {
    opening: [
      (ctx) => `${ctx.addressee}, 안녕하세요.`,
      (ctx) => `${ctx.addressee}, 늘 인사만 드리다가 조심스럽게 연락드립니다.`,
    ],
    reason: [
      (ctx) => `이번 ${ctx.eventType}에 이웃 분들과 함께하기 좋은 시간이 있어 안내드립니다.`,
      (ctx) => `이번 ${ctx.eventType}는 편하게 참여할 수 있는 자리라 한번 권해 드리고 싶었습니다.`,
    ],
    reassure: [
      () => "처음 참석하셔도 어색하지 않도록 안내해 드리겠습니다.",
      () => "잠시 들르셨다가 가셔도 괜찮습니다.",
    ],
    ask: [
      () => "시간 되시면 함께해 보실래요?",
      () => "괜찮으시면 이번에 같이 가면 좋겠습니다.",
    ],
    closing: [
      () => "편하게 답 주세요.",
      () => "부담 없이 검토해 보시고 알려주세요.",
    ],
  },
  family: {
    opening: [
      (ctx) => `${ctx.addressee}, 진심으로 초대하고 싶은 마음이 있어 연락드려요.`,
      (ctx) => `${ctx.addressee}, 가족이라 더 조심스럽게 제안해 보고 싶었어요.`,
    ],
    reason: [
      (ctx) => `이번 ${ctx.eventType}에서 함께 시간을 보내면 큰 힘이 될 것 같아요.`,
      (ctx) => `이번 ${ctx.eventType}는 편하게 참여할 수 있는 자리라 같이 가면 좋겠어요.`,
    ],
    reassure: [
      () => "억지로가 아니라 편안한 마음으로 오시면 됩니다.",
      () => "제가 옆에서 같이 있으니 부담 내려놓으셔도 돼요.",
    ],
    ask: [
      () => "괜찮으면 이번에 같이 가요.",
      () => "시간 되면 함께해 주세요.",
    ],
    closing: [
      () => "편하실 때 답 주세요.",
      () => "천천히 생각해 보고 알려줘도 괜찮아요.",
    ],
  },
  self: {
    opening: [
      () => "이번 모임은 제 마음을 다시 세우고 싶은 마음으로 준비하고 있습니다.",
      () => "저 자신을 위해서도 다시 중심을 잡고 싶어 이번 자리를 결심했습니다.",
    ],
    reason: [
      (ctx) => `이번 ${ctx.eventType}를 통해 마음을 정돈하고 신앙의 기본을 다시 다지고 싶습니다.`,
      (ctx) => `이번 ${ctx.eventType}에서 삶을 돌아보며 필요한 결단을 하고 싶습니다.`,
    ],
    reassure: [
      () => "무리하지 않고, 가능한 범위에서 꾸준히 참여해 보겠습니다.",
      () => "완벽하게 하려 하기보다 한 걸음씩 이어가겠습니다.",
    ],
    ask: [
      () => "이번에는 꼭 참여해 보겠습니다.",
      () => "이번 기회를 다시 시작의 계기로 삼겠습니다.",
    ],
    closing: [
      () => "작은 순종부터 이어가겠습니다.",
      () => "오늘 결심을 실제 행동으로 옮기겠습니다.",
    ],
  },
  general: {
    opening: [
      (ctx) => `${ctx.addressee}, 안녕하세요.`,
      (ctx) => `${ctx.addressee}, 조심스럽게 연락드립니다.`,
    ],
    reason: [
      (ctx) => `이번 ${ctx.eventType}에 함께하시면 좋겠다는 마음으로 연락드렸습니다.`,
      (ctx) => `이번 ${ctx.eventType}는 편하게 참여할 수 있는 자리라 안내드립니다.`,
    ],
    reassure: [
      () => "부담 없이 참여하실 수 있습니다.",
      () => "편하게 와서 쉬어가셔도 괜찮습니다.",
    ],
    ask: [
      () => "시간 되시면 함께해 보실래요?",
      () => "괜찮으시면 이번에 함께해 주세요.",
    ],
    closing: [
      () => "편하게 생각해 보시고 알려주세요.",
      () => "부담 없이 답해 주시면 됩니다.",
    ],
  },
};

function normalizeLength(raw: unknown): InvitationLength {
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

function softenLine(
  line: string,
  profile: RelationshipProfile,
  seed: number,
  length: InvitationLength
): string {
  const pool = PROFILE_EMOJIS[profile] || PROFILE_EMOJIS.general || [];
  if (!pool.length) return line;

  // 너무 과한 느낌을 막기 위해 짧은 메시지는 일부 케이스에서만 이모지를 붙인다.
  if (length === "short" && seed % 2 === 1) return line;
  return `${line} ${pick(pool, seed)}`;
}

function buildContext(body: {
  personName?: string;
  relationship?: string;
  eventType?: string;
  date?: string;
  location?: string;
  additionalContext?: string;
}): TemplateContext {
  const relationship = resolveRelationship(body.relationship);
  const name = sanitizeName(body.personName);
  const profile = detectRelationshipProfile({
    relationship,
    personName: name,
    additionalContext: body.additionalContext,
  });

  return {
    addressee: toAddressee(name, relationship),
    person: toReference(name, relationship),
    profile,
    relationshipLabel:
      RELATIONSHIP_LABELS[relationship] || relationshipProfileLabel(profile),
    eventType: sanitizeName(body.eventType) || "예배",
    date: sanitizeName(body.date),
    location: sanitizeName(body.location),
    additionalContext: sanitizeName(body.additionalContext),
    meta: eventMeta(body.date, body.location),
  };
}

function composeInvitation(
  ctx: TemplateContext,
  length: InvitationLength,
  variationIndex: number
): string {
  const tone = TONES[ctx.profile] || TONES.general!;
  const seed = Math.abs(Number(variationIndex) || 0);

  const lines: string[] = [
    softenLine(pick(tone.opening, seed)(ctx), ctx.profile, seed + 11, length),
    pick(tone.reason, seed + 1)(ctx),
  ];

  if (length !== "short") {
    lines.push(pick(tone.reassure, seed + 2)(ctx));
    if (ctx.additionalContext && length === "long") {
      lines.push(`${ctx.person}의 요즘 상황(${ctx.additionalContext})을 생각하며 더 조심스럽게 연락드렸습니다.`);
    }
  }

  lines.push(softenLine(pick(tone.ask, seed + 3)(ctx), ctx.profile, seed + 13, length));

  if (length !== "short") {
    const closing = pick(tone.closing, seed + 4)(ctx);
    lines.push(length === "long" ? softenLine(closing, ctx.profile, seed + 17, length) : closing);
  }

  if (ctx.meta) {
    lines.push(`일시/장소: ${ctx.meta}`);
  }

  return cleanup(lines.join("\n\n"));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    personName = "",
    relationship,
    eventType,
    date,
    location = "",
    additionalContext = "",
    variationIndex = 0,
    length,
  } = body;

  const normalizedLength = normalizeLength(length);
  const ctx = buildContext({
    personName,
    relationship,
    eventType,
    date,
    location,
    additionalContext,
  });

  const message = composeInvitation(ctx, normalizedLength, variationIndex);
  return NextResponse.json({ message });
}
