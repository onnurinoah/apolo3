import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import { PRAYER_PROMPT } from "@/lib/prompts";
import { fixParticles } from "@/lib/korean";
import {
  objective,
  sanitizeName,
  subjective,
  toReference,
  withTopic,
} from "@/lib/person";

type PrayerLength = "short" | "medium" | "long";

type PrayerContext = {
  name: string;
  relationship: string;
  topic: string;
  additionalContext?: string;
  targetRef: string;
  targetObj: string;
  targetSub: string;
  targetTopic: string;
};

type PrayerTemplate = (ctx: PrayerContext, length: PrayerLength) => string;

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
  friend: "친구",
  colleague: "직장동료",
  acquaintance: "지인",
  self: "본인",
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

function addContextLine(ctx: PrayerContext): string {
  if (!ctx.additionalContext) return "";
  return `${ctx.targetTopic} 현재 ${ctx.additionalContext}의 상황 안에 있습니다.`;
}

function finishPrayer(lines: string[]): string {
  return cleanup([...lines, "예수님의 이름으로 기도합니다. 아멘."].join("\n\n"));
}

const TEMPLATES: PrayerTemplate[] = [
  // 1. ACTS
  (ctx, length) => {
    const short = [
      "사랑의 하나님 아버지,",
      `오늘 ${ctx.targetObj} 주님께 올려드립니다.`,
      `주님을 떠난 마음을 돌이켜 ${ctx.targetSub} 주님을 알게 하옵소서.`,
      `${ctx.topic}의 필요 위에 은혜를 베푸시고 복음의 빛을 비추어 주옵소서.`,
      "주님의 선하심을 찬양하며 감사드립니다.",
    ];

    const medium = [
      "사랑의 하나님 아버지,",
      "주님은 생명의 주인이시며 영혼을 살리시는 분이십니다.",
      `오늘 ${ctx.targetObj} 주님 앞에 올려드립니다.`,
      addContextLine(ctx),
      `${ctx.targetSub} 주님보다 다른 것을 의지했던 마음을 내려놓고 은혜 앞으로 돌아오게 하옵소서.`,
      `${ctx.topic} 가운데 주의 도우심을 경험하게 하시고, 무엇보다 예수 그리스도의 복음을 분명히 듣고 믿게 하옵소서 (요한복음 14:6).`,
      "저에게도 사랑으로 섬길 지혜와 인내를 허락해 주옵소서.",
    ].filter(Boolean);

    const long = [
      ...medium,
      `또한 ${ctx.targetSub} 오늘 하루의 작은 일상 속에서도 주님의 손길을 발견하게 하시고, 닫힌 마음이 부드러워지게 하옵소서.`,
      "복음의 씨앗이 뿌리내리고 자라 열매 맺도록 성령께서 친히 역사해 주옵소서 (고린도전서 3:6).",
      "저 역시 조급함을 내려놓고 사랑으로 동행하게 하옵소서.",
    ];

    return finishPrayer(length === "short" ? short : length === "long" ? long : medium);
  },

  // 2. 성경 선포
  (ctx, length) => {
    const short = [
      "주님, 주의 말씀을 의지하여 기도합니다.",
      `"여호와는 나의 목자시니 내게 부족함이 없으리로다"(시편 23:1) 말씀대로 ${ctx.targetSub} 돌보아 주옵소서.`,
      `${ctx.topic}의 문제 앞에서 낙심하지 않게 하시고, 하나님의 선하신 뜻을 보게 하옵소서.`,
    ];
    const medium = [
      "말씀으로 역사하시는 하나님,",
      `오늘 ${ctx.targetObj} 위해 주의 약속을 붙들고 기도합니다.`,
      `"내가 너를 고아와 같이 버려두지 아니하고 너희에게로 오리라"(요한복음 14:18) 하신 말씀을 ${ctx.targetTopic} 이루어 주옵소서.`,
      `${ctx.topic} 속에 흔들리는 마음을 붙드시고, 주님의 평강으로 채워 주옵소서 (빌립보서 4:7).`,
      `${ctx.targetSub} 복음의 진리를 받아들이고 예수 그리스도를 인격적으로 만나게 하옵소서.`,
    ];
    const long = [
      ...medium,
      "의심과 두려움의 소리가 아니라 말씀의 소리가 더 크게 들리게 하옵소서.",
      `"주의 말씀은 내 발에 등이요 내 길에 빛이니이다"(시편 119:105) 말씀대로 ${ctx.targetSub} 걸음을 인도해 주옵소서.`,
      "저 또한 말씀으로 섬기며 삶으로 증거하게 하옵소서.",
    ];
    return finishPrayer(length === "short" ? short : length === "long" ? long : medium);
  },

  // 3. 영적 전쟁
  (ctx, length) => {
    const short = [
      "전능하신 하나님,",
      `${ctx.targetObj} 가로막는 어둠의 권세를 예수님의 이름으로 물리쳐 주옵소서.`,
      `${ctx.targetSub} 복음의 빛을 분명히 보고 듣게 하시며 ${ctx.topic} 속에서도 소망을 붙들게 하옵소서.`,
      "성령으로 마음을 깨우시고 믿음의 길로 인도해 주옵소서.",
    ];
    const medium = [
      "전능하신 하나님,",
      `오늘 ${ctx.targetObj} 위해 영적 전쟁 가운데 기도합니다.`,
      "거짓과 두려움으로 마음을 묶는 모든 권세를 예수님의 이름으로 물리쳐 주옵소서.",
      `${ctx.targetSub} 복음의 광채를 보게 하시고(고린도후서 4:4-6), ${ctx.topic}의 문제 앞에서도 주님을 의지하게 하옵소서.`,
      addContextLine(ctx),
      "성령께서 마음의 문을 열어 진리를 기쁨으로 받아들이게 하옵소서.",
    ].filter(Boolean);
    const long = [
      ...medium,
      "상한 마음을 치유하시고 두려움을 믿음으로 바꾸어 주옵소서.",
      `"주께서 내 편이시라 내가 두려워하지 아니하리니"(시편 118:6) 말씀을 ${ctx.targetTopic} 실제가 되게 하옵소서.`,
      "저에게도 깨어 기도하며 사랑으로 섬길 담대함을 주옵소서.",
    ];
    return finishPrayer(length === "short" ? short : length === "long" ? long : medium);
  },

  // 4. 성령 인도
  (ctx, length) => {
    const short = [
      "성령 하나님,",
      `${ctx.targetObj} 찾아와 주셔서 마음을 부드럽게 하옵소서.`,
      `${ctx.topic}의 문제를 통해 주님을 더 깊이 찾게 하시고, 복음을 깨닫는 은혜를 주옵소서.`,
      "하나님의 음성을 듣고 순종하는 마음을 허락해 주옵소서.",
    ];
    const medium = [
      "성령 하나님,",
      `오늘 ${ctx.targetObj} 위한 기도 가운데 친히 역사해 주옵소서.`,
      `${ctx.targetSub} 하나님의 사랑을 알게 하시고, 주의 인도하심을 거절하지 않게 하옵소서.`,
      `${ctx.topic}의 자리에서 길을 잃지 않게 하시고, 주께서 준비하신 길을 보게 하옵소서 (잠언 3:5-6).`,
      addContextLine(ctx),
      "저에게도 때에 맞는 말과 태도를 주셔서 복음의 통로가 되게 하옵소서.",
    ].filter(Boolean);
    const long = [
      ...medium,
      "마음을 혼란하게 하는 소리가 잦아들고 성령의 세미한 음성에 민감하게 하옵소서.",
      `"그가 너희를 모든 진리 가운데로 인도하시리라"(요한복음 16:13) 말씀을 이루어 주옵소서.`,
      "순종의 첫걸음을 시작할 용기까지 허락해 주옵소서.",
    ];
    return finishPrayer(length === "short" ? short : length === "long" ? long : medium);
  },

  // 5. 축복 기도
  (ctx, length) => {
    const short = [
      "사랑의 하나님,",
      `${ctx.targetObj} 복 주시고 지켜 주옵소서.`,
      `${ctx.topic} 위에 은혜를 더하시고 평강으로 인도해 주옵소서 (민수기 6:24-26).`,
      "주님의 선하심을 날마다 경험하게 하옵소서.",
    ];
    const medium = [
      "복의 근원이신 하나님,",
      `오늘 ${ctx.targetObj} 축복하며 기도합니다.`,
      `"여호와는 네게 복을 주시고 너를 지키시기를 원하며"(민수기 6:24) 말씀대로 지켜 주옵소서.`,
      `${ctx.topic}의 모든 필요를 채우시고, 불안 대신 평강으로 채워 주옵소서.`,
      `${ctx.targetSub} 삶의 모든 선한 열매가 하나님께로부터 온 것임을 알게 하옵소서.`,
    ];
    const long = [
      ...medium,
      "지친 마음에는 위로를, 흔들리는 마음에는 담대함을, 닫힌 마음에는 소망을 허락해 주옵소서.",
      addContextLine(ctx),
      "가정과 일터와 관계 속에서 주의 선하심이 드러나게 하옵소서.",
    ].filter(Boolean);
    return finishPrayer(length === "short" ? short : length === "long" ? long : medium);
  },

  // 6. 인내 중보
  (ctx, length) => {
    const short = [
      "주님, 포기하지 않고 다시 기도합니다.",
      `${ctx.targetObj} 향한 주의 계획을 이루어 주옵소서.`,
      `${ctx.topic}의 문제 속에서도 믿음의 눈을 열어 주시고, 복음을 향한 마음을 열어 주옵소서.`,
    ];
    const medium = [
      "신실하신 하나님,",
      "낙심하지 말고 기도하라 하신 주님의 말씀을 붙들고 중보합니다 (누가복음 18:1).",
      `${ctx.targetObj} 위한 기도가 멈추지 않게 하시고, 주의 때에 열매를 보게 하옵소서.`,
      `${ctx.topic}의 어려움 속에서 주님을 찾는 마음이 깊어지게 하옵소서.`,
      `"구하라 그리하면 너희에게 주실 것이요"(마태복음 7:7) 약속을 붙듭니다.`,
    ];
    const long = [
      ...medium,
      addContextLine(ctx),
      "보이지 않는 시간에도 주님이 일하고 계심을 믿습니다.",
      `${ctx.targetTopic} 기다림 속에서 지치지 않도록 새 힘을 부어 주옵소서.`,
    ].filter(Boolean);
    return finishPrayer(length === "short" ? short : length === "long" ? long : medium);
  },

  // 7. 감사 기도
  (ctx, length) => {
    const short = [
      "감사의 하나님,",
      `${ctx.targetObj} 허락하신 모든 은혜에 감사드립니다.`,
      `${ctx.topic} 속에서도 감사의 이유를 발견하게 하시고, 복음의 기쁨을 알게 하옵소서.`,
    ];
    const medium = [
      "감사의 하나님 아버지,",
      `오늘 ${ctx.targetObj} 위해 감사로 기도합니다.`,
      "지금까지 지켜 주신 은혜를 기억하게 하시고, 작은 일에서도 주의 선하심을 보게 하옵소서.",
      `${ctx.topic}의 자리에서도 불평보다 감사를 선택하게 하시며, 감사가 믿음의 문을 열게 하옵소서 (데살로니가전서 5:18).`,
      `${ctx.targetSub} 궁극적으로 구원의 은혜를 기뻐하게 하옵소서.`,
    ];
    const long = [
      ...medium,
      addContextLine(ctx),
      "과거의 은혜를 기억하게 하시고 오늘의 은혜를 보게 하시며 내일의 은혜를 기대하게 하옵소서.",
      "감사가 관계를 회복시키고 마음을 건강하게 세우는 통로가 되게 하옵소서.",
    ].filter(Boolean);
    return finishPrayer(length === "short" ? short : length === "long" ? long : medium);
  },

  // 8. 회개 기도
  (ctx, length) => {
    const short = [
      "거룩하신 하나님,",
      `${ctx.targetObj} 주 앞에서 마음을 낮추게 하옵소서.`,
      "죄를 가볍게 여기지 않게 하시고, 예수님의 십자가 은혜로 돌이키게 하옵소서.",
      `${ctx.topic}의 혼란 속에서도 진리로 돌아오게 하옵소서.`,
    ];
    const medium = [
      "거룩하신 하나님 아버지,",
      `오늘 ${ctx.targetObj} 위해 회개의 은혜를 구합니다.`,
      "자신을 의지하던 교만과 하나님 없이 살 수 있다는 착각을 내려놓게 하옵소서.",
      "주께서 주시는 애통함으로 죄를 미워하고 은혜를 붙들게 하옵소서 (요한일서 1:9).",
      `${ctx.topic}의 문제 앞에서도 자기 방법이 아니라 주님의 길을 선택하게 하옵소서.`,
    ];
    const long = [
      ...medium,
      addContextLine(ctx),
      "정죄감에 머무는 회개가 아니라 복음으로 돌아오는 회개가 되게 하옵소서.",
      `${ctx.targetSub} 진실한 회복의 길로 나아가고 삶의 열매로 변화가 드러나게 하옵소서.`,
    ].filter(Boolean);
    return finishPrayer(length === "short" ? short : length === "long" ? long : medium);
  },

  // 9. 치유 기도
  (ctx, length) => {
    const short = [
      "치유하시는 하나님,",
      `${ctx.targetObj} 몸과 마음을 만져 주옵소서.`,
      `${ctx.topic}의 상처가 주님 안에서 회복되게 하시고, 두려움 대신 평안을 허락해 주옵소서.`,
      `"그가 채찍에 맞음으로 우리가 나음을 입었도다"(이사야 53:5) 약속을 붙듭니다.`,
    ];
    const medium = [
      "치유의 주님,",
      `오늘 ${ctx.targetObj} 위해 간구합니다.`,
      "지친 몸과 마음을 어루만져 주시고, 상한 부분마다 주님의 은혜를 부어 주옵소서.",
      `${ctx.topic}의 문제로 생긴 불안과 낙심을 거두어 주시고, 견딜 힘과 회복의 속도를 더해 주옵소서.`,
      addContextLine(ctx),
      "주님의 손길로 새 힘을 얻게 하옵소서.",
    ].filter(Boolean);
    const long = [
      ...medium,
      "필요한 도움의 사람들과 치료의 길을 정확히 만나게 하옵소서.",
      "회복이 지연될 때에도 믿음이 무너지지 않게 하시고, 공동체의 사랑으로 지지받게 하옵소서.",
      `${ctx.targetSub} 궁극적으로 영혼의 치유자이신 예수님을 만나게 하옵소서.`,
    ];
    return finishPrayer(length === "short" ? short : length === "long" ? long : medium);
  },

  // 10. 지혜 기도
  (ctx, length) => {
    const short = [
      "지혜의 하나님,",
      `${ctx.targetObj} 분별의 지혜를 허락해 주옵소서.`,
      `${ctx.topic}의 중요한 선택 앞에서 바른 길을 보게 하시고 흔들리지 않게 하옵소서.`,
      "사람의 소리보다 주의 말씀을 따르게 하옵소서.",
    ];
    const medium = [
      "지혜를 주시는 하나님,",
      `오늘 ${ctx.targetObj} 위해 기도합니다.`,
      "복잡한 문제 속에서 핵심을 분별하는 지혜를 주시고 성급한 결정을 막아 주옵소서.",
      `${ctx.topic}의 자리에서 하나님의 뜻을 먼저 묻게 하시고, 선한 조언을 들을 겸손을 허락해 주옵소서.`,
      `"너희 중에 누구든지 지혜가 부족하거든 하나님께 구하라"(야고보서 1:5) 말씀을 붙듭니다.`,
    ];
    const long = [
      ...medium,
      addContextLine(ctx),
      "문이 열릴 때와 멈출 때를 분별하게 하시고, 결과보다 순종을 우선하게 하옵소서.",
      `${ctx.targetSub} 선택의 순간마다 하나님을 영화롭게 하는 길을 택하게 하옵소서.`,
    ].filter(Boolean);
    return finishPrayer(length === "short" ? short : length === "long" ? long : medium);
  },

  // 11. 관계회복 기도
  (ctx, length) => {
    const short = [
      "화평의 주님,",
      `${ctx.targetObj} 관계의 상처를 회복시켜 주옵소서.`,
      "오해는 풀어지고 굳은 마음은 부드러워지게 하시며, 용서의 은혜를 허락해 주옵소서.",
      `${ctx.topic}의 문제 속에서도 사랑으로 말하고 행동하게 하옵소서.`,
    ];
    const medium = [
      "화평케 하시는 하나님,",
      `오늘 ${ctx.targetObj} 관계를 위해 기도합니다.`,
      "상처 준 말과 행동을 돌아보게 하시고, 필요한 사과와 용서를 실천할 용기를 주옵소서.",
      `${ctx.topic}의 긴장 속에서도 마음의 평안을 잃지 않게 하시고, 지혜로운 대화를 열어 주옵소서.`,
      `"화평하게 하는 자는 복이 있나니"(마태복음 5:9) 말씀을 삶으로 살게 하옵소서.`,
    ];
    const long = [
      ...medium,
      addContextLine(ctx),
      "끊어진 관계의 다리가 다시 놓이게 하시고, 진실한 경청과 배려가 시작되게 하옵소서.",
      `${ctx.targetSub} 주님의 사랑을 경험하며 관계의 주도권을 은혜로 회복하게 하옵소서.`,
    ].filter(Boolean);
    return finishPrayer(length === "short" ? short : length === "long" ? long : medium);
  },

  // 12. 전도자 기도
  (ctx, length) => {
    const short = [
      "주님, 저를 복음의 통로로 사용해 주옵소서.",
      `${ctx.targetObj} 향한 사랑이 식지 않게 하시고, 주님의 때를 기다리게 하옵소서.`,
      "말보다 삶으로 증거하게 하시고, 필요한 순간 담대히 복음을 전하게 하옵소서.",
    ];
    const medium = [
      "주님, 전도의 주권이 하나님께 있음을 고백합니다.",
      `${ctx.targetObj} 향한 사랑과 인내를 저에게 부어 주옵소서.`,
      "조급함으로 밀어붙이지 않게 하시고, 경청하며 동행하는 태도를 배우게 하옵소서.",
      `${ctx.topic}의 상황을 공감으로 품고, 복음을 전할 적절한 문장을 지혜롭게 선택하게 하옵소서.`,
      `"너희 마음에 그리스도를 주로 삼아 거룩하게 하고... 대답할 것을 항상 준비하되 온유와 두려움으로 하라"(베드로전서 3:15) 말씀을 실천하게 하옵소서.`,
    ];
    const long = [
      ...medium,
      addContextLine(ctx),
      `${ctx.targetSub} 저를 통해 교회보다 먼저 예수님의 향기를 경험하게 하옵소서.`,
      "열매의 때를 하나님께 맡기며 오늘 해야 할 순종을 놓치지 않게 하옵소서.",
    ].filter(Boolean);
    return finishPrayer(length === "short" ? short : length === "long" ? long : medium);
  },
];

function buildContext(body: {
  personName?: string;
  relationship?: string;
  topic?: string;
  additionalContext?: string;
}): PrayerContext {
  const rawRelationship =
    body.relationship === "family" ||
    body.relationship === "friend" ||
    body.relationship === "colleague" ||
    body.relationship === "acquaintance" ||
    body.relationship === "self"
      ? body.relationship
      : "acquaintance";

  const name = sanitizeName(body.personName);
  const topic = TOPIC_LABELS[body.topic || ""] || sanitizeName(body.topic) || "삶";
  const additionalContext = sanitizeName(body.additionalContext);

  return {
    name,
    relationship: RELATIONSHIP_LABELS[rawRelationship] || "지인",
    topic,
    additionalContext,
    targetRef: toReference(name, rawRelationship),
    targetObj: objective(name, rawRelationship),
    targetSub: subjective(name, rawRelationship),
    targetTopic: withTopic(name, rawRelationship),
  };
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

  const openai = getOpenAIClient();
  if (openai) {
    try {
      const prayerStyles = [
        "ACTS 형식",
        "성경 선포",
        "영적 전쟁",
        "성령 인도",
        "축복",
        "인내 중보",
        "감사",
        "회개",
        "치유",
        "지혜",
        "관계회복",
        "전도자 기도",
      ];
      const styleHint = prayerStyles[Math.abs(Number(variationIndex) || 0) % prayerStyles.length];
      const maxTokensByLength: Record<PrayerLength, number> = {
        short: 300,
        medium: 700,
        long: 1200,
      };

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: PRAYER_PROMPT },
          {
            role: "user",
            content: [
              "다음 정보를 바탕으로 기도문을 작성해주세요.",
              `- 이름/호칭: ${ctx.name || "미입력"}`,
              `- 관계: ${ctx.relationship}`,
              `- 기도 주제: ${ctx.topic}`,
              `- 추가 상황: ${ctx.additionalContext || "미입력"}`,
              `- 기도 형식: ${styleHint}`,
              `- 길이: ${normalizedLength}`,
              `- 변형 인덱스: ${variationIndex}`,
              "요청: 어색한 조사/호칭 없이 자연스럽고 반복 없는 문장으로 작성해주세요.",
            ].join("\n"),
          },
        ],
        temperature: 0.88,
        max_tokens: maxTokensByLength[normalizedLength],
      });

      const prayer = cleanup(completion.choices[0]?.message?.content || "");
      if (prayer) {
        return NextResponse.json({ prayer });
      }
    } catch {
      // Fall through to fallback templates
    }
  }

  const idx = Math.abs(Number(variationIndex) || 0) % TEMPLATES.length;
  const prayer = TEMPLATES[idx](ctx, normalizedLength);
  return NextResponse.json({ prayer });
}
