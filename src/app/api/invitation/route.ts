import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import { INVITATION_PROMPT } from "@/lib/prompts";
import { fixParticles, josa } from "@/lib/korean";
import {
  eventMeta,
  sanitizeName,
  toAddressee,
  toReference,
} from "@/lib/person";

type InvitationLength = "short" | "medium" | "long";

type TemplateContext = {
  addressee: string;
  person: string;
  relationship: string;
  eventType: string;
  date?: string;
  location?: string;
  meta: string;
};

type InvitationTemplate = (ctx: TemplateContext) => string;

const RELATIONSHIP_LABELS: Record<string, string> = {
  family: "가족",
  friend: "친구",
  colleague: "직장동료",
  acquaintance: "지인",
};

const SHORT_TEMPLATES: InvitationTemplate[] = [
  (ctx) => `${ctx.addressee}, 이번 ${ctx.eventType}에 함께 오실래요?\n부담 없이 편하게 와서 쉬어가셔도 좋아요.${ctx.meta ? `\n${ctx.meta}` : ""}`,
  (ctx) => `${ctx.addressee}, 요즘 문득 생각이 나서 연락드려요.\n이번 ${ctx.eventType}에 잠깐 들르실 수 있을까요?\n함께 가드릴게요.${ctx.meta ? `\n${ctx.meta}` : ""}`,
  (ctx) => `${ctx.addressee}, 마음이 조금 지칠 때 조용히 쉬어갈 자리가 있어요.\n${ctx.eventType}에 한번 같이 가보면 좋겠습니다.${ctx.meta ? `\n${ctx.meta}` : ""}`,
  (ctx) => `${ctx.addressee}, 오랜만에 안부 전합니다.\n이번 ${ctx.eventType}${josa(ctx.eventType, "은/는")} 부담 없는 모임이에요.\n시간 되시면 함께해요.${ctx.meta ? `\n${ctx.meta}` : ""}`,
  (ctx) => `${ctx.addressee}, 이번 주에 ${ctx.eventType}가 있어요.\n강요하는 자리가 아니라 편히 앉아 듣고 쉬는 시간이어서 초대드리고 싶었습니다.${ctx.meta ? `\n${ctx.meta}` : ""}`,
  (ctx) => `${ctx.addressee}, 짧게 안부 전해요.\n${ctx.eventType}에 함께 오시면 제가 옆에서 안내해드릴게요.${ctx.meta ? `\n${ctx.meta}` : ""}`,
  (ctx) => `${ctx.addressee}, 이번 ${ctx.eventType}에서 따뜻한 시간을 같이 보내면 좋겠어요.\n가능하시면 편하게 답 주세요.${ctx.meta ? `\n${ctx.meta}` : ""}`,
  (ctx) => `${ctx.addressee}, 혹시 이번 ${ctx.eventType}에 잠깐 시간 내실 수 있을까요?\n어색하지 않게 제가 함께하겠습니다.${ctx.meta ? `\n${ctx.meta}` : ""}`,
];

const MEDIUM_TEMPLATES: InvitationTemplate[] = [
  (ctx) => `${ctx.addressee}, 안부 전합니다.\n요즘 마음이 분주할 때 잠시 멈춰 쉬는 시간이 필요하다는 생각이 들어서요.\n이번 ${ctx.eventType}에 함께 가면 좋겠습니다.\n편하게 와서 듣고 쉬어가셔도 충분해요.\n제가 처음부터 끝까지 같이 있겠습니다.${ctx.meta ? `\n${ctx.meta}` : ""}`,
  (ctx) => `${ctx.addressee}, 평소에 한번 초대드리고 싶었는데 이제야 조심스럽게 말씀드립니다.\n이번 ${ctx.eventType}${josa(ctx.eventType, "은/는")} 부담 없이 참여할 수 있는 자리입니다.\n무언가를 강요하는 분위기가 아니고, 삶을 돌아보는 시간이 중심이에요.\n괜찮으시면 함께해 주세요.\n제가 동행하겠습니다.${ctx.meta ? `\n${ctx.meta}` : ""}`,
  (ctx) => `${ctx.addressee}, 제가 요즘 붙잡고 있는 위로를 ${ctx.person}과 나누고 싶었습니다.\n그래서 이번 ${ctx.eventType}에 초대드려요.\n처음 오셔도 어색하지 않게 안내해 드릴 수 있습니다.\n부담은 내려놓고, 마음 편히 와주세요.${ctx.meta ? `\n${ctx.meta}` : ""}`,
  (ctx) => `${ctx.addressee}, 갑작스러운 연락이 실례가 되지 않았으면 합니다.\n이번 ${ctx.eventType}에서 삶에 도움이 되는 메시지를 함께 듣고 싶어 연락드렸습니다.\n짧게 머무르셔도 괜찮고, 조용히 보고 가셔도 괜찮습니다.\n가능하시다면 함께 가겠습니다.${ctx.meta ? `\n${ctx.meta}` : ""}`,
  (ctx) => `${ctx.addressee}, 요즘 어떻게 지내시는지 궁금했습니다.\n이번 ${ctx.eventType}${josa(ctx.eventType, "으로/로")} 모임이 있어 조심스럽게 초대드립니다.\n편안한 분위기에서 말씀을 듣고 서로 인사 나누는 자리입니다.\n시간이 허락되면 함께해 주세요.\n제가 곁에서 안내해 드릴게요.${ctx.meta ? `\n${ctx.meta}` : ""}`,
  (ctx) => `${ctx.addressee}, 예전부터 꼭 한번 모시고 싶었습니다.\n이번 ${ctx.eventType}는 처음 오시는 분도 편히 참여할 수 있도록 준비된 자리예요.\n가볍게 와서 분위기만 느껴보셔도 됩니다.\n원하시면 끝나고 따뜻한 차 한 잔도 함께해요.${ctx.meta ? `\n${ctx.meta}` : ""}`,
  (ctx) => `${ctx.addressee}, 저에게 소중한 시간을 ${ctx.person}과도 나누고 싶어 연락드렸습니다.\n이번 ${ctx.eventType}에 함께 오시면 좋겠습니다.\n편하게 듣고 쉬어가는 시간이라 부담이 적습니다.\n괜찮으시면 답 주시고, 제가 같이 이동하겠습니다.${ctx.meta ? `\n${ctx.meta}` : ""}`,
  (ctx) => `${ctx.addressee}, 요즘 상황 속에서 작은 위로가 필요하실 것 같아 생각이 났습니다.\n이번 ${ctx.eventType}에 함께하면 힘을 얻는 시간이 될 것 같아요.\n강요가 아니라 진심 어린 초대입니다.\n시간이 맞으면 같이 가요.${ctx.meta ? `\n${ctx.meta}` : ""}`,
];

const LONG_TEMPLATES: InvitationTemplate[] = [
  (ctx) => `${ctx.addressee}, 안부 전합니다.\n요즘 하루가 빠르게 지나가다 보니 마음을 정리할 시간이 부족하다는 생각이 들 때가 많습니다.\n저도 그럴 때 공동체 안에서 잠시 멈추고 숨을 고르며 큰 위로를 얻곤 했습니다.\n그래서 이번 ${ctx.eventType}에 ${ctx.person}을 진심으로 초대드리고 싶었습니다.\n처음 오시는 분도 어색하지 않도록 충분히 안내해 드리고, 무리한 참여를 요청하지도 않습니다.\n편하게 듣고 쉬어가셔도 좋고, 분위기만 느끼고 가셔도 괜찮습니다.\n괜찮으시면 함께 가겠습니다.${ctx.meta ? `\n${ctx.meta}` : ""}`,
  (ctx) => `${ctx.addressee}, 요즘 지내시는 모습을 떠올리며 조심스럽게 연락드립니다.\n저는 힘든 시기마다 사람들과 함께 예배드리는 시간이 생각보다 큰 힘이 된다는 걸 자주 경험했습니다.\n이번 ${ctx.eventType}에도 그런 잔잔한 위로와 회복의 시간이 준비되어 있어요.\n말씀을 듣고, 조용히 생각을 정리하고, 필요한 만큼만 머물다 가셔도 됩니다.\n${ctx.person}에게 부담이 되지 않도록 제가 처음부터 끝까지 동행하겠습니다.\n가능하시면 함께해 주세요.${ctx.meta ? `\n${ctx.meta}` : ""}`,
  (ctx) => `${ctx.addressee}, 평소에 꼭 한번 모시고 싶었는데 이제야 말씀드립니다.\n이번 ${ctx.eventType}${josa(ctx.eventType, "은/는")} 처음 오시는 분을 배려해 차분하게 진행되는 모임입니다.\n억지로 무언가를 하게 하지 않고, 듣고 쉬고 돌아보는 시간이 중심입니다.\n${ctx.person}이 편히 참여할 수 있도록 제가 곁에서 안내할게요.\n괜찮으시면 이번 기회에 함께해 주시면 감사하겠습니다.${ctx.meta ? `\n${ctx.meta}` : ""}`,
  (ctx) => `${ctx.addressee}, 갑작스러운 연락이 놀라우실 수 있어 먼저 양해를 구합니다.\n저는 요즘 삶을 정돈하는 데 도움이 되는 시간을 꾸준히 갖고 있는데, 그중 하나가 예배 자리였습니다.\n그래서 이번 ${ctx.eventType}에 ${ctx.person}을 초대하고 싶었습니다.\n부담을 느끼지 않도록 자유롭게 참여하셔도 되고, 중간에 조용히 이동하셔도 괜찮습니다.\n마음이 허락되면 함께해 주세요.\n제가 편하게 동행하겠습니다.${ctx.meta ? `\n${ctx.meta}` : ""}`,
  (ctx) => `${ctx.addressee}, 요즘 일상 속에서 마음이 무거울 때가 많지 않으신가요.\n저 역시 그런 시간을 지나며 혼자 버티기보다 함께 예배드리고 이야기 나누는 시간이 큰 위로가 되었습니다.\n이번 ${ctx.eventType}${josa(ctx.eventType, "으로/로")} 초대드리는 이유도 그 위로를 나누고 싶어서입니다.\n강요나 부담 없이 편하게 오셔서 분위기만 느끼고 가셔도 충분합니다.\n필요하시면 이동부터 자리 안내까지 제가 함께하겠습니다.${ctx.meta ? `\n${ctx.meta}` : ""}`,
  (ctx) => `${ctx.addressee}, 늘 드리고 싶던 초대를 전합니다.\n이번 ${ctx.eventType}는 말씀과 찬양, 그리고 짧은 교제를 통해 마음을 다시 세우는 시간으로 준비되어 있습니다.\n처음 참여하시는 분이 불편하지 않도록 진행이 단순하고, 강요 없이 자유롭게 머물 수 있습니다.\n${ctx.person}이 오시면 제가 곁에서 돕고, 끝난 뒤에도 필요한 만큼 함께하겠습니다.\n괜찮으시다면 이번에 함께해 주세요.${ctx.meta ? `\n${ctx.meta}` : ""}`,
  (ctx) => `${ctx.addressee}, 오늘은 감사와 함께 작은 부탁을 드리고 싶습니다.\n제가 소중히 여기는 ${ctx.eventType} 자리에 ${ctx.person}을 초대하고 싶습니다.\n요란하거나 부담스러운 분위기가 아니라, 차분하게 마음을 돌아보고 힘을 얻는 시간이 중심입니다.\n참석하시면 제가 옆에서 하나씩 안내해 드릴게요.\n부담은 내려놓고 편하게 생각해 주세요.\n가능하시면 함께해 주시면 기쁘겠습니다.${ctx.meta ? `\n${ctx.meta}` : ""}`,
  (ctx) => `${ctx.addressee}, 바쁘신 중에 메시지 읽어주셔서 감사합니다.\n저는 요즘 공동체 안에서 예배드리는 시간이 삶의 균형을 잡는 데 큰 도움이 되고 있습니다.\n이번 ${ctx.eventType}${josa(ctx.eventType, "은/는")} 그런 의미를 나누기 좋은 자리라 ${ctx.person}을 꼭 떠올리게 되었습니다.\n처음이어서 어색할 수 있지만, 제가 곁에 있으니 걱정하지 않으셔도 됩니다.\n편히 오셔서 필요한 만큼만 머무르셔도 괜찮습니다.\n함께할 수 있으면 좋겠습니다.${ctx.meta ? `\n${ctx.meta}` : ""}`,
];

const TEMPLATES_BY_LENGTH: Record<InvitationLength, InvitationTemplate[]> = {
  short: SHORT_TEMPLATES,
  medium: MEDIUM_TEMPLATES,
  long: LONG_TEMPLATES,
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

function buildContext(body: {
  personName?: string;
  relationship?: string;
  eventType?: string;
  date?: string;
  location?: string;
}): TemplateContext {
  const relationship = RELATIONSHIP_LABELS[body.relationship || ""] || "지인";
  const eventType = sanitizeName(body.eventType) || "예배";
  const name = sanitizeName(body.personName);
  const rawRelationship =
    body.relationship === "family" ||
    body.relationship === "friend" ||
    body.relationship === "colleague" ||
    body.relationship === "acquaintance"
      ? body.relationship
      : "acquaintance";

  return {
    addressee: toAddressee(name, rawRelationship),
    person: toReference(name, rawRelationship),
    relationship,
    eventType,
    date: sanitizeName(body.date),
    location: sanitizeName(body.location),
    meta: eventMeta(body.date, body.location),
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    personName = "",
    relationship,
    eventType,
    date,
    location = "",
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
  });

  const openai = getOpenAIClient();
  if (openai) {
    try {
      const maxTokensByLength: Record<InvitationLength, number> = {
        short: 220,
        medium: 450,
        long: 850,
      };
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: INVITATION_PROMPT },
          {
            role: "user",
            content: [
              "다음 정보로 1:1 초대 메시지를 작성해주세요.",
              `- 이름/호칭: ${sanitizeName(personName) || "미입력"}`,
              `- 관계: ${ctx.relationship}`,
              `- 모임명: ${ctx.eventType}`,
              `- 일시: ${ctx.date || "미입력(언급 생략 가능)"}`,
              `- 장소: ${ctx.location || "미입력(언급 생략 가능)"}`,
              `- 길이: ${normalizedLength}`,
              `- 변형 인덱스: ${variationIndex}`,
              "요청: 어색한 조사/호칭 없이 자연스럽게 작성하고, 같은 문장 반복을 피해주세요.",
            ].join("\n"),
          },
        ],
        temperature: 0.9,
        max_tokens: maxTokensByLength[normalizedLength],
      });

      const message = cleanup(completion.choices[0]?.message?.content || "");
      if (message) {
        return NextResponse.json({ message });
      }
    } catch {
      // Fall through to template fallback
    }
  }

  const templates = TEMPLATES_BY_LENGTH[normalizedLength];
  const idx = Math.abs(Number(variationIndex) || 0) % templates.length;
  const message = cleanup(templates[idx](ctx));

  return NextResponse.json({ message });
}
