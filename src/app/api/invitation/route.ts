import { NextRequest, NextResponse } from "next/server";
import { fixParticles, josa } from "@/lib/korean";
import { getOpenAIClient } from "@/lib/openai";
import { INVITATION_PROMPT } from "@/lib/prompts";
import {
  detectRelationshipProfile,
  eventMeta,
  PersonRelationship,
  RelationshipProfile,
  relationshipProfileLabel,
  sanitizeName,
  toAddressee,
  toInvitationReference,
} from "@/lib/person";

type InvitationLength = "short" | "medium" | "long";
type SpeechStyle = "honorific" | "casual";

type TemplateContext = {
  addressee: string;
  person: string;
  profile: RelationshipProfile;
  relationshipLabel: string;
  status: string;
  speechStyle: SpeechStyle;
  chatStyleSample?: string;
  eventType: string;
  date?: string;
  location?: string;
  additionalContext?: string;
  contextSnippet?: string;
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

const STATUS_LABELS: Record<string, string> = {
  praying: "기도 중",
  approaching: "접근 중",
  invited: "초대함",
  attending: "참석 중",
  decided: "결신",
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

const COMMON_TONE: ProfileTone = {
  opening: [
    (ctx) => `${ctx.addressee}, 안녕하세요.`,
    (ctx) => `${ctx.addressee}, 조심스럽게 연락드립니다.`,
    (ctx) => `${ctx.addressee}, 평안하신지요.`,
  ],
  reason: [
    (ctx) => `이번 ${ctx.eventType}는 부담 없이 쉬어갈 수 있는 자리라 생각되어 떠올렸어요.`,
    (ctx) => `이번 ${ctx.eventType}는 처음 오셔도 편하게 참여할 수 있는 분위기예요.`,
    (ctx) => `이번 ${ctx.eventType}를 함께하면 마음이 정돈되는 시간이 될 것 같아요.`,
  ],
  reassure: [
    () => "부담 없이 분위기만 보고 가셔도 괜찮아요.",
    () => "처음이셔도 어색하지 않게 제가 옆에서 도와드릴게요.",
    () => "무언가를 강요하는 자리가 아니라 편히 머물 수 있는 시간이에요.",
  ],
  ask: [
    () => "시간 괜찮으시면 함께해 보실래요?",
    () => "괜찮으시면 이번에 같이해 주시면 좋겠어요.",
    () => "한 번만 가볍게 함께해 주실 수 있을까요?",
  ],
  closing: [
    () => "편하실 때 답 주시면 감사하겠습니다.",
    () => "부담 없이 생각해 보시고 알려주세요.",
    () => "천천히 생각해 보셔도 괜찮아요.",
  ],
};

const TONES: Partial<Record<RelationshipProfile, ProfileTone>> = {
  parent: {
    opening: [
      (ctx) => `${ctx.addressee}, 늘 감사한 마음으로 연락드려요.`,
      (ctx) => `${ctx.addressee}, 조심스럽지만 꼭 모시고 싶은 마음이 있어 연락드렸어요.`,
      (ctx) => `${ctx.addressee}, 제가 소중히 여기는 시간을 함께 나누고 싶어 연락드렸어요.`,
    ],
    reason: [
      (ctx) => `이번 ${ctx.eventType}는 마음을 차분히 정리하고 위로를 얻기 좋은 자리예요.`,
      (ctx) => `이번 ${ctx.eventType}에서 삶을 돌아보고 마음에 힘을 얻는 시간을 함께하면 좋겠어요.`,
      (ctx) => `이번 ${ctx.eventType}는 조용히 앉아 계셔도 충분히 의미 있는 시간이에요.`,
    ],
    reassure: [
      () => "부담 없이 앉아서 듣기만 하셔도 괜찮아요.",
      () => "처음부터 끝까지 제가 옆에서 안내해 드릴게요.",
      () => "혹시 불편하시면 중간에 쉬셔도 전혀 괜찮아요.",
    ],
    ask: [
      () => "괜찮으시면 제가 모시고 함께 다녀오고 싶어요.",
      () => "시간이 되시면 이번에 함께해 주시면 좋겠습니다.",
      () => "무리되지 않으시면 이번에 잠깐만 함께해 주실 수 있을까요.",
    ],
    closing: [
      () => "편하실 때 알려주세요.",
      () => "부담 없이 생각해 보시고 답 주시면 감사하겠습니다.",
      () => "늘 감사한 마음입니다. 편히 답 주세요.",
    ],
  },
  grandparent: {
    opening: [
      (ctx) => `${ctx.addressee}, 안부 드립니다.`,
      (ctx) => `${ctx.addressee}, 평안하신지요.`,
      (ctx) => `${ctx.addressee}, 늘 건강하시길 기도하며 연락드립니다.`,
    ],
    reason: [
      (ctx) => `이번 ${ctx.eventType}에 조용히 함께하면 좋겠다는 마음으로 연락드렸습니다.`,
      (ctx) => `이번 ${ctx.eventType}는 편안하게 참석하실 수 있는 자리라 조심스럽게 모시고 싶습니다.`,
      (ctx) => `이번 ${ctx.eventType}는 마음이 편안해지는 시간이라 생각되어 안내드립니다.`,
    ],
    reassure: [
      () => "오셔서 쉬어가시듯 편하게 계시면 됩니다.",
      () => "불편하시지 않도록 제가 곁에서 잘 도와드리겠습니다.",
      () => "잠시만 머무르셔도 괜찮고 부담 갖지 않으셔도 됩니다.",
    ],
    ask: [
      () => "시간 괜찮으시면 함께해 주실 수 있을까요.",
      () => "이번 기회에 함께 자리해 주시면 감사하겠습니다.",
      () => "괜찮으시면 이번에 잠시 함께해 주시면 좋겠습니다.",
    ],
    closing: [
      () => "무리하지 마시고 괜찮으실 때 말씀 주세요.",
      () => "편하신 답변 기다리겠습니다.",
      () => "늘 평안하시길 바랍니다.",
    ],
  },
  sibling: {
    opening: [
      (ctx) => `${ctx.addressee}, 요즘 어때?`,
      (ctx) => `${ctx.addressee}, 문득 생각나서 연락했어.`,
      (ctx) => `${ctx.addressee}, 바쁠 텐데 잠깐만 읽어줘.`,
    ],
    reason: [
      (ctx) => `이번 ${ctx.eventType}에 같이 가면 서로 좋은 시간 보낼 수 있을 것 같아.`,
      (ctx) => `이번 ${ctx.eventType}는 편하게 참여할 수 있는 자리라 같이 가자고 제안해 보고 싶었어.`,
      (ctx) => `이번 ${ctx.eventType}는 생각보다 편안한 분위기라 부담 없이 함께하면 좋겠어.`,
    ],
    reassure: [
      () => "어색하면 중간에 잠깐 나와도 괜찮아.",
      () => "부담 없이 와서 분위기만 보고 가도 돼.",
      () => "내가 같이 있을 테니 부담 느끼지 않아도 돼.",
    ],
    ask: [
      () => "괜찮으면 이번에 같이 가자.",
      () => "시간 되면 같이 가줄래?",
      () => "한 번만 같이 가보고 아니면 다음엔 안 가도 괜찮아.",
    ],
    closing: [
      () => "편하게 답 줘.",
      () => "부담 갖지 말고 생각해 보고 알려줘.",
      () => "강요하는 건 아니니까 편히 결정해 줘.",
    ],
  },
  friend: {
    opening: [
      (ctx) => `${ctx.addressee}, 잘 지내지?`,
      (ctx) => `${ctx.addressee}, 오랜만에 안부 남겨.`,
      (ctx) => `${ctx.addressee}, 생각나서 톡 남겨봐.`,
    ],
    reason: [
      (ctx) => `이번 ${ctx.eventType}가 있는데, 생각보다 편하고 따뜻한 분위기라 너랑 같이 가고 싶었어.`,
      (ctx) => `이번 ${ctx.eventType}는 처음 가는 사람도 부담 없는 자리라 한번 같이 가보면 좋겠어.`,
      (ctx) => `이번 ${ctx.eventType}는 마음이 조금 쉬어가는 느낌이라 너랑 함께하면 좋겠다고 생각했어.`,
    ],
    reassure: [
      () => "어색하면 내가 옆에서 같이 있어 줄게.",
      () => "뭔가를 강요하는 자리가 아니라 편히 쉬어가는 시간이야.",
      () => "부담되면 잠깐만 있다가 나와도 전혀 괜찮아.",
    ],
    ask: [
      () => "시간 되면 이번에 같이 가볼래?",
      () => "괜찮으면 한번만 같이 가주면 좋겠어.",
      () => "편하면 이번 주에 같이 가보자.",
    ],
    closing: [
      () => "부담 없이 생각해 보고 답 줘.",
      () => "편하게 결정해 줘도 돼.",
      () => "네 마음 편한 쪽으로 답해 줘.",
    ],
  },
  coworker: {
    opening: [
      (ctx) => `${ctx.addressee}, 안녕하세요.`,
      (ctx) => `${ctx.addressee}, 바쁘실 텐데 갑작스러운 연락 드립니다.`,
      (ctx) => `${ctx.addressee}, 업무 중에 죄송하지만 잠깐 말씀드립니다.`,
    ],
    reason: [
      (ctx) => `이번 ${ctx.eventType}에 부담 없이 참여할 수 있는 시간이 있어 조심스럽게 초대드립니다.`,
      (ctx) => `이번 ${ctx.eventType}는 조용히 쉬어가며 생각을 정리하기 좋은 자리라 안내드리고 싶었습니다.`,
      (ctx) => `이번 ${ctx.eventType}는 처음 오셔도 편히 머물 수 있는 분위기여서 말씀드립니다.`,
    ],
    reassure: [
      () => "처음 오셔도 불편하지 않도록 제가 함께하겠습니다.",
      () => "잠시만 머무르셔도 괜찮고, 편하신 범위에서 참여하시면 됩니다.",
      () => "전혀 부담 없으시게 제가 동선까지 안내드리겠습니다.",
    ],
    ask: [
      () => "시간이 허락되시면 함께해 주실 수 있을까요.",
      () => "괜찮으시면 이번에 함께 자리해 주시면 감사하겠습니다.",
      () => "가능하시면 잠깐만 함께해 주셔도 좋겠습니다.",
    ],
    closing: [
      () => "부담 없이 검토해 보시고 편하실 때 알려주세요.",
      () => "답변은 편하실 때 주셔도 됩니다.",
      () => "읽어주셔서 감사합니다.",
    ],
  },
  acquaintance: {
    opening: [
      (ctx) => `${ctx.addressee}, 안녕하세요.`,
      (ctx) => `${ctx.addressee}, 평안하신지요.`,
      (ctx) => `${ctx.addressee}, 조심스럽게 연락드립니다.`,
    ],
    reason: [
      (ctx) => `이번 ${ctx.eventType}가 있어 조심스럽게 초대드리고 싶었습니다.`,
      (ctx) => `이번 ${ctx.eventType}는 부담 없이 참여할 수 있는 모임이라 알려드립니다.`,
      (ctx) => `이번 ${ctx.eventType}가 편안한 분위기라 생각나 안내드립니다.`,
    ],
    reassure: [
      () => "강요 없이 편하게 참여하실 수 있는 자리입니다.",
      () => "분위기만 보고 가셔도 괜찮습니다.",
      () => "편하신 선에서만 참석하셔도 충분합니다.",
    ],
    ask: [
      () => "가능하시면 함께해 보시겠어요?",
      () => "시간이 맞으시면 한번 들러 주시면 좋겠습니다.",
      () => "괜찮으시면 이번에 가볍게 함께해 주실 수 있을까요.",
    ],
    closing: [
      () => "편하게 생각해 보시고 알려주세요.",
      () => "답변은 부담 없이 주시면 됩니다.",
      () => "읽어주셔서 감사합니다.",
    ],
  },
  "former-church-colleague": {
    opening: [
      (ctx) => `${ctx.addressee}, 오랜만에 안부드립니다.`,
      (ctx) => `${ctx.addressee}, 예전에 함께 예배드리던 시간이 떠올라 연락드렸습니다.`,
      (ctx) => `${ctx.addressee}, 문득 생각나 조심스럽게 연락드립니다.`,
    ],
    reason: [
      (ctx) => `이번 ${ctx.eventType}에 함께하면 좋겠다는 마음이 들어 조심스럽게 초대드립니다.`,
      (ctx) => `이번 ${ctx.eventType}는 다시 가볍게 발걸음을 옮기기 좋은 자리라 생각되어 안내드립니다.`,
      (ctx) => `이번 ${ctx.eventType}는 부담 없이 다시 시작해 보기 좋은 자리라 생각했습니다.`,
    ],
    reassure: [
      () => "편하게 오셔서 분위기만 느끼고 가셔도 충분합니다.",
      () => "부담스럽지 않게 제가 곁에서 조용히 도와드리겠습니다.",
      () => "무언가를 강요하기보다 편히 머무를 수 있는 자리입니다.",
    ],
    ask: [
      () => "괜찮으시면 이번에 함께하실 수 있을까요.",
      () => "시간이 되시면 함께 자리해 주시면 반가울 것 같습니다.",
      () => "편하신 때에 한 번만 함께해 주셔도 감사하겠습니다.",
    ],
    closing: [
      () => "편하실 때 답변 주시면 감사하겠습니다.",
      () => "부담 없이 생각해 보시고 알려주세요.",
      () => "늘 평안하시길 바랍니다.",
    ],
  },
  neighbor: {
    opening: [
      (ctx) => `${ctx.addressee}, 안녕하세요.`,
      (ctx) => `${ctx.addressee}, 늘 인사만 드리다가 조심스럽게 연락드립니다.`,
      (ctx) => `${ctx.addressee}, 가까운 이웃으로 반가운 마음에 연락드립니다.`,
    ],
    reason: [
      (ctx) => `이번 ${ctx.eventType}에 이웃 분들과 함께하기 좋은 시간이 있어 안내드립니다.`,
      (ctx) => `이번 ${ctx.eventType}는 편하게 참여할 수 있는 자리라 한번 권해 드리고 싶었습니다.`,
      (ctx) => `이번 ${ctx.eventType}는 부담 없이 잠깐 들르기 좋은 시간입니다.`,
    ],
    reassure: [
      () => "처음 참석하셔도 어색하지 않도록 안내해 드리겠습니다.",
      () => "잠시 들르셨다가 가셔도 괜찮습니다.",
      () => "편하게 오셔서 쉬어가셔도 충분합니다.",
    ],
    ask: [
      () => "시간 되시면 함께해 보실래요?",
      () => "괜찮으시면 이번에 같이 가면 좋겠습니다.",
      () => "부담 없으실 때 한 번 들러 주시면 좋겠습니다.",
    ],
    closing: [
      () => "편하게 답 주세요.",
      () => "부담 없이 검토해 보시고 알려주세요.",
      () => "좋은 하루 보내세요.",
    ],
  },
  family: {
    opening: [
      (ctx) => `${ctx.addressee}, 진심으로 초대하고 싶은 마음이 있어 연락드려요.`,
      (ctx) => `${ctx.addressee}, 가족이라 더 조심스럽게 제안해 보고 싶었어요.`,
      (ctx) => `${ctx.addressee}, 마음 나누고 싶어서 연락해요.`,
    ],
    reason: [
      (ctx) => `이번 ${ctx.eventType}에서 함께 시간을 보내면 큰 힘이 될 것 같아요.`,
      (ctx) => `이번 ${ctx.eventType}는 편하게 참여할 수 있는 자리라 같이 가면 좋겠어요.`,
      (ctx) => `이번 ${ctx.eventType}는 쉬어가며 마음을 정리하기 좋은 시간이 될 거예요.`,
    ],
    reassure: [
      () => "억지로가 아니라 편안한 마음으로 오시면 됩니다.",
      () => "제가 옆에서 같이 있으니 부담 내려놓으셔도 돼요.",
      () => "편한 만큼만 함께하셔도 충분해요.",
    ],
    ask: [
      () => "괜찮으면 이번에 같이 가요.",
      () => "시간 되면 함께해 주세요.",
      () => "한 번만 가볍게 같이해 보면 좋겠어요.",
    ],
    closing: [
      () => "편하실 때 답 주세요.",
      () => "천천히 생각해 보고 알려줘도 괜찮아요.",
      () => "부담 갖지 말고 마음 가는 대로 알려줘요.",
    ],
  },
  self: {
    opening: [
      () => "이번 모임은 제 마음을 다시 세우고 싶은 마음으로 준비하고 있습니다.",
      () => "저 자신을 위해서도 다시 중심을 잡고 싶어 이번 자리를 결심했습니다.",
      () => "다시 처음 마음으로 돌아가고 싶어 이번 시간을 준비했습니다.",
    ],
    reason: [
      (ctx) => `이번 ${ctx.eventType}를 통해 마음을 정돈하고 신앙의 기본을 다시 다지고 싶습니다.`,
      (ctx) => `이번 ${ctx.eventType}에서 삶을 돌아보며 필요한 결단을 하고 싶습니다.`,
      (ctx) => `이번 ${ctx.eventType}를 새로운 시작의 계기로 삼고 싶습니다.`,
    ],
    reassure: [
      () => "무리하지 않고, 가능한 범위에서 꾸준히 참여해 보겠습니다.",
      () => "완벽하게 하려 하기보다 한 걸음씩 이어가겠습니다.",
      () => "작게 시작하더라도 멈추지 않겠습니다.",
    ],
    ask: [
      () => "이번에는 꼭 참여해 보겠습니다.",
      () => "이번 기회를 다시 시작의 계기로 삼겠습니다.",
      () => "오늘 결심을 실제 행동으로 옮기겠습니다.",
    ],
    closing: [
      () => "작은 순종부터 이어가겠습니다.",
      () => "흔들려도 다시 돌아오겠습니다.",
      () => "주님 앞에 정직하게 걸어가겠습니다.",
    ],
  },
  general: {
    opening: [
      (ctx) => `${ctx.addressee}, 안녕하세요.`,
      (ctx) => `${ctx.addressee}, 조심스럽게 연락드립니다.`,
      (ctx) => `${ctx.addressee}, 평안하신지요.`,
    ],
    reason: [
      (ctx) => `이번 ${ctx.eventType}에 함께하시면 좋겠다는 마음으로 연락드렸습니다.`,
      (ctx) => `이번 ${ctx.eventType}는 편하게 참여할 수 있는 자리라 안내드립니다.`,
      (ctx) => `이번 ${ctx.eventType}가 부담 없는 분위기라 조심스럽게 제안드립니다.`,
    ],
    reassure: [
      () => "부담 없이 참여하실 수 있습니다.",
      () => "편하게 와서 쉬어가셔도 괜찮습니다.",
      () => "처음이셔도 어색하지 않게 안내해 드릴게요.",
    ],
    ask: [
      () => "시간 되시면 함께해 보실래요?",
      () => "괜찮으시면 이번에 함께해 주세요.",
      () => "가능하시면 잠깐만 함께해 주셔도 좋겠습니다.",
    ],
    closing: [
      () => "편하게 생각해 보시고 알려주세요.",
      () => "부담 없이 답해 주시면 됩니다.",
      () => "읽어주셔서 감사합니다.",
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

function normalizeOpening(line: string): string {
  return line.replace(/^\s*,\s*/, "").trim();
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

function summarizeContext(raw?: string): string | undefined {
  const cleaned = sanitizeName(raw)
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return undefined;

  const chunks = cleaned
    .split(/[.!?·,]/)
    .map((v) => v.trim())
    .filter(Boolean);

  const chunk = (chunks[0] || cleaned).replace(/^요즘\s+/, "");
  if (!chunk) return undefined;

  const normalized = chunk
    .replace(/있음$/, "있는 상태")
    .replace(/중$/, "중인 상황");

  return normalized.length > 24 ? `${normalized.slice(0, 24)}...` : normalized;
}

function applyEventParticles(text: string, eventType: string): string {
  if (!eventType) return text;
  const topic = `${eventType}${josa(eventType, "은/는")}`;
  const obj = `${eventType}${josa(eventType, "을/를")}`;
  return text
    .replaceAll(`${eventType}는`, topic)
    .replaceAll(`${eventType}를`, obj);
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

function mergeTone(profile: RelationshipProfile): ProfileTone {
  const specific = TONES[profile] || TONES.general || COMMON_TONE;
  if (profile === "friend" || profile === "sibling" || profile === "family") {
    return specific;
  }
  return {
    opening: [...specific.opening, ...COMMON_TONE.opening],
    reason: [...specific.reason, ...COMMON_TONE.reason],
    reassure: [...specific.reassure, ...COMMON_TONE.reassure],
    ask: [...specific.ask, ...COMMON_TONE.ask],
    closing: [...specific.closing, ...COMMON_TONE.closing],
  };
}

function resolveSpeechStyle(raw?: string): SpeechStyle {
  return raw === "casual" ? "casual" : "honorific";
}

function profileBySpeech(
  profile: RelationshipProfile,
  speechStyle: SpeechStyle
): RelationshipProfile {
  if (speechStyle === "casual") {
    if (profile === "friend" || profile === "sibling" || profile === "family") {
      return profile;
    }
    return "friend";
  }

  if (profile === "friend" || profile === "sibling" || profile === "family") {
    return "acquaintance";
  }
  return profile;
}

function softenLine(
  line: string,
  profile: RelationshipProfile,
  seed: number,
  length: InvitationLength
): string {
  const pool = PROFILE_EMOJIS[profile] || PROFILE_EMOJIS.general || [];
  if (!pool.length) return line;

  if (length === "short" && seed % 2 === 1) return line;
  if (length === "long" || seed % 3 === 0) {
    return `${line} ${pickOne(pool, seed)}`;
  }
  return line;
}

function buildContext(body: {
  personName?: string;
  relationship?: string;
  status?: string;
  addressee?: string;
  speechStyle?: string;
  chatStyleSample?: string;
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
    addressee: sanitizeName(body.addressee) || toAddressee(name, relationship),
    person: toInvitationReference(name),
    profile,
    relationshipLabel:
      RELATIONSHIP_LABELS[relationship] || relationshipProfileLabel(profile),
    status: STATUS_LABELS[sanitizeName(body.status)] || "기도 중",
    speechStyle: resolveSpeechStyle(body.speechStyle),
    chatStyleSample: sanitizeName(body.chatStyleSample),
    eventType: sanitizeName(body.eventType) || "예배",
    date: sanitizeName(body.date),
    location: sanitizeName(body.location),
    additionalContext: sanitizeName(body.additionalContext),
    contextSnippet: summarizeContext(body.additionalContext),
    meta: eventMeta(body.date, body.location),
  };
}

function contextMention(ctx: TemplateContext, seed: number): string {
  const snippet = ctx.contextSnippet;
  if (!snippet) return "";

  const casual =
    ctx.speechStyle === "casual" ||
    ctx.profile === "friend" ||
    ctx.profile === "sibling" ||
    ctx.profile === "family";
  const variants = casual
    ? [
        `${snippet}라 더 조심스럽게 연락했어.`,
        `${ctx.person === "그분" ? "요즘 상황" : `${ctx.person} 상황`}(${snippet})이 계속 마음에 남았어.`,
        `요즘 '${snippet}' 같은 시간을 지나고 있다 보니 마음이 쓰이더라.`,
      ]
    : [
        `${snippet}라 더 조심스럽게 연락드렸어요.`,
        `${ctx.person === "그분" ? "요즘 상황" : `${ctx.person}의 상황`}(${snippet})을 생각하며 마음이 쓰였어요.`,
        `요즘 '${snippet}' 같은 시간을 지나고 계셔서 마음이 쓰였어요.`,
      ];

  return pickOne(variants, seed);
}

function composeInvitation(
  ctx: TemplateContext,
  length: InvitationLength,
  variationIndex: number
): string {
  const seed = stableHash(
    [
      profileBySpeech(ctx.profile, ctx.speechStyle),
      ctx.relationshipLabel,
      ctx.eventType,
      ctx.speechStyle,
      ctx.chatStyleSample || "",
      ctx.meta,
      ctx.additionalContext || "",
      String(variationIndex),
    ].join("|")
  );

  const effectiveProfile = profileBySpeech(ctx.profile, ctx.speechStyle);
  const tone = mergeTone(effectiveProfile);
  const opening = normalizeOpening(
    softenLine(pickOne(tone.opening, seed)(ctx), effectiveProfile, seed + 3, length)
  );
  const reason = pickOne(tone.reason, seed + 5)(ctx);
  const reassure = pickOne(tone.reassure, seed + 7)(ctx);
  const ask = softenLine(pickOne(tone.ask, seed + 11)(ctx), effectiveProfile, seed + 13, length);
  const closing = softenLine(pickOne(tone.closing, seed + 17)(ctx), effectiveProfile, seed + 19, length);
  const extraReason = pickOne(tone.reason, seed + 23)(ctx);
  const context = contextMention(ctx, seed + 29);

  const lines: string[] = [];
  lines.push(opening);

  if (length === "short") {
    lines.push(ask);
  } else if (length === "medium") {
    lines.push(reason, reassure, ask, closing);
  } else {
    lines.push(reason);
    if (extraReason !== reason) lines.push(extraReason);
    lines.push(reassure);
    if (context) lines.push(context);
    lines.push(ask, closing);
  }

  if (ctx.meta) {
    lines.push(`일시/장소: ${ctx.meta}`);
  }

  return cleanup(applyEventParticles(lines.join("\n\n"), ctx.eventType));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    personName = "",
    relationship,
    status,
    addressee = "",
    speechStyle = "honorific",
    chatStyleSample = "",
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
    status,
    addressee,
    speechStyle,
    chatStyleSample,
    eventType,
    date,
    location,
    additionalContext,
  });

  const fallbackMessage = composeInvitation(ctx, normalizedLength, variationIndex);
  const references = [
    composeInvitation(ctx, normalizedLength, variationIndex + 1),
    composeInvitation(ctx, normalizedLength, variationIndex + 2),
    composeInvitation(ctx, normalizedLength, variationIndex + 3),
  ];

  const openai = getOpenAIClient();
  if (!openai) {
    return NextResponse.json({ message: fallbackMessage, source: "database" });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      max_tokens: normalizedLength === "long" ? 650 : normalizedLength === "medium" ? 440 : 280,
      messages: [
        { role: "system", content: INVITATION_PROMPT },
        {
          role: "user",
          content: [
            "아래 DB 초안들을 참고하여 자연스럽고 부담 없는 초대메시지를 작성하세요.",
            "메시지는 카카오톡에 바로 보낼 수 있는 톤으로 작성합니다.",
            "",
            `대상: ${ctx.person}`,
            `관계: ${ctx.relationshipLabel} (${ctx.profile})`,
            `현재 상태: ${ctx.status}`,
            `호칭: ${ctx.addressee}`,
            `말투: ${ctx.speechStyle === "casual" ? "반말" : "존대"}`,
            `평소 톡 말투 샘플: ${ctx.chatStyleSample || "없음"}`,
            `모임명: ${ctx.eventType}`,
            `일시/장소: ${ctx.meta || "미입력"}`,
            `상황: ${ctx.additionalContext || "없음"}`,
            `길이: ${normalizedLength}`,
            "",
            "DB 초안 A:",
            fallbackMessage,
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
            "1) 이름/호칭은 과하지 않게 사용",
            "2) 한국어 조사 정확히",
            "3) 오글거리는 과장 표현 금지",
            "4) 관계별 어투를 자연스럽게 반영",
            "5) 존대/반말 지시를 반드시 지킴",
            "6) 평소 톡 말투 샘플이 있으면 문장 리듬에 반영",
          ].join("\n"),
        },
      ],
    });

    const aiMessageRaw = completion.choices[0]?.message?.content || fallbackMessage;
    const aiMessage = cleanup(applyEventParticles(aiMessageRaw, ctx.eventType));
    return NextResponse.json({ message: aiMessage, source: "ai" });
  } catch {
    return NextResponse.json({ message: fallbackMessage, source: "database" });
  }
}
