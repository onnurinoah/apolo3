import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import { PRAYER_PROMPT } from "@/lib/prompts";
import { postfix, josa } from "@/lib/korean";

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

// 6개 다양한 형식의 기도문 템플릿
const FALLBACK_TEMPLATES = [

  // 1. ACTS 형식 기도 (찬양-고백-감사-간구)
  (name: string, _rel: string, topic: string) =>
    `사랑하는 하나님 아버지,\n\n[찬양] 주님은 모든 사람을 아시고 사랑하시며, 단 한 사람도 잃어버리기를 원치 않으시는 하나님이십니다. 주님의 사랑과 주권에 경배드립니다.\n\n[고백] ${postfix(name, "을/를")} 진심으로 사랑하지 못했던 것, 복음 전하기를 두려워했던 것을 고백합니다. 주님의 은혜로 용서해 주옵소서.\n\n[감사] ${name}과(와) 관계 맺게 해주시고, 이렇게 위해 기도할 마음을 주신 것에 감사드립니다.\n\n[간구] 이제 ${postfix(name, "을/를")} 위해 간절히 구합니다. 주님, ${name}의 ${postfix(topic, "을/를")} 위해 은혜를 베풀어 주옵소서. 무엇보다 ${name}${josa(name, "이/")} 살아계신 하나님을 만나는 은혜를 주옵소서.\n\n"이는 주께서 그들을 위하여 구하셨으므로 내가 알았나이다" (시편 56:9)\n\n예수님의 이름으로 기도합니다. 아멘. 🙏`,

  // 2. 성경 선포 기도 - 말씀으로 선언
  (name: string, _rel: string, topic: string) =>
    `주님,\n\n${name}${josa(name, "을/를")} 위해 주님의 말씀을 선포합니다.\n\n"너희를 향한 나의 생각을 내가 아나니 평안이요 재앙이 아니니라 너희에게 미래와 희망을 주는 것이니라" (예레미야 29:11)\n\n이 말씀이 ${name}의 삶에 성취되게 하여 주옵소서.\n\n${name}의 ${topic} 가운데, 주님의 뜻이 하늘에서 이루어진 것같이 ${name}의 삶에서도 이루어지기를 선포합니다. 사망의 권세가 예수님의 이름 앞에 물러서고, ${name}${josa(name, "이/")} 생명과 빛 가운데 거하게 하여 주옵소서.\n\n"나는 포도나무요 너희는 가지라 그가 내 안에, 내가 그 안에 거하면 사람이 열매를 많이 맺나니" (요한복음 15:5)\n\n${name}${josa(name, "이/")} 예수님 안에 거하는 삶을 살게 되기를 선포하며 기도드립니다.\n\n예수님의 이름으로 기도합니다. 아멘. ✝️`,

  // 3. 영적 전쟁 중보기도 - 영적 눈멂에 대한 대적
  (name: string, _rel: string, topic: string) =>
    `전능하신 하나님,\n\n${postfix(name, "을/를")} 위해 영적 전쟁으로 기도합니다.\n\n"이 세상의 신이 믿지 아니하는 자들의 마음을 혼미하게 하여 그리스도의 영광의 복음의 광채가 비치지 못하게 함이라" (고린도후서 4:4)\n\n주님, ${name}의 마음을 가리고 있는 영적 눈멂을 예수님의 이름으로 대적합니다. 성령님이 ${name}의 마음에 복음의 빛을 비추어 주옵소서.\n\n${name}의 ${topic} 가운데 역사하시어, 그 필요가 채워지는 것을 통해 살아계신 하나님을 만나게 해주옵소서. 사탄이 심어놓은 불신과 편견이 예수님의 이름으로 물러서기를 기도합니다.\n\n"주의 영이 계신 곳에는 자유가 있느니라" (고린도후서 3:17)\n\n${name}${josa(name, "이/")} 영적 자유 가운데 하나님의 사랑을 만나게 하여 주옵소서.\n\n예수님의 이름으로 기도합니다. 아멘. 🕊️`,

  // 4. 성령의 역사를 구하는 중보기도
  (name: string, _rel: string, topic: string) =>
    `주님,\n\n${postfix(name, "을/를")} 위해 성령님의 역사를 구합니다.\n\n"그가 와서 죄에 대하여, 의에 대하여, 심판에 대하여 세상을 책망하시리라" (요한복음 16:8)\n\n성령님, ${name}의 마음 안에서 이 일을 이루어 주옵소서. ${name}${josa(name, "이/")} 지금 ${topic} 가운데 있습니다. 이 상황을 통해 주님이 말씀하시고, ${name}${josa(name, "이/")} 그 음성을 들을 수 있도록 마음의 귀를 열어주옵소서.\n\n"보라 내가 문 밖에 서서 두드리노니 누구든지 내 음성을 듣고 문을 열면 내가 그에게로 들어가 그와 더불어 먹고 그는 나와 더불어 먹으리라" (요한계시록 3:20)\n\n${name}${josa(name, "이/")} 주님이 두드리시는 소리를 듣게 하여 주옵소서.\n또한 저에게도 적절한 때에 맞는 말과 행동을 주시어, ${postfix(name, "을/를")} 향한 복음의 통로가 될 수 있게 해주옵소서.\n\n예수님의 이름으로 기도합니다. 아멘. 💛`,

  // 5. 축복 기도 - 민수기 제사장 축복 형식
  (name: string, _rel: string, topic: string) =>
    `사랑이 많으신 하나님,\n\n오늘 ${postfix(name, "을/를")} 주님 앞에 올려드리며 축복을 구합니다.\n\n"여호와는 네게 복을 주시고 너를 지키시기를 원하며\n여호와는 그의 얼굴을 네게 비추사 은혜 베푸시기를 원하며\n여호와는 그 얼굴을 네게로 향하여 드사 평강 주시기를 원하노라" (민수기 6:24-26)\n\n이 제사장의 축복이 ${name}의 삶에 풍성히 임하게 하여 주옵소서.\n\n${name}의 ${topic} 가운데 하나님의 은혜가 부어지게 하시고, 그 은혜 안에서 하나님을 알아가는 기쁨이 시작되기를 소망합니다. ${name}${josa(name, "이/")} 복을 받는 삶을 살아갈 때, 그 복의 근원이 하나님이심을 깨닫게 되기를 기도합니다.\n\n"모든 좋은 은사와 온전한 선물이 다 위로부터 빛들의 아버지께로서 내려오나니" (야고보서 1:17)\n\n예수님의 이름으로 기도합니다. 아멘. 🌟`,

  // 6. 인내의 중보기도 - 누가복음 18장 방식 (끈질긴 기도)
  (name: string, _rel: string, topic: string) =>
    `주님,\n\n예수님께서 "항상 기도하고 낙심하지 말라" 하셨습니다. (누가복음 18:1)\n오늘도 ${postfix(name, "을/를")} 위해 포기하지 않고 기도합니다.\n\n${name}${josa(name, "이/")} 아직 주님을 모르지만, 주님은 이미 ${postfix(name, "을/를")} 사랑하셔서 독생자를 보내주셨습니다. (요한복음 3:16) 그 사랑을 믿기에 포기하지 않겠습니다.\n\n${name}의 ${topic} 가운데, 하나님이 직접 ${name}에게 찾아와 주옵소서. 꿈으로, 상황으로, 사람을 통해, 주님의 살아계심을 드러내 주옵소서.\n\n"구하라 그리하면 너희에게 주실 것이요 찾으라 그리하면 찾아낼 것이요 문을 두드리라 그리하면 너희에게 열릴 것이니" (마태복음 7:7)\n\n오늘도 구합니다. 내일도 구하겠습니다. ${name}${josa(name, "이/")} 주님을 만나는 날까지.\n\n예수님의 이름으로 기도합니다. 아멘. 🙏`,
];

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    personName,
    relationship,
    topic,
    additionalContext,
    variationIndex = 0,
  } = body;

  const topicLabel = TOPIC_LABELS[topic] || topic;
  const relLabel = RELATIONSHIP_LABELS[relationship] || relationship;

  // Try AI first
  const openai = getOpenAIClient();
  if (openai) {
    try {
      const prayerStyles = [
        "ACTS 형식(찬양-고백-감사-간구)",
        "성경 선포 기도(말씀 선언)",
        "영적 전쟁 중보기도",
        "성령의 역사를 구하는 기도",
        "축복 기도(민수기 6장 형식)",
        "인내의 중보기도(끈질긴 기도)",
      ];
      const styleHint = prayerStyles[variationIndex % prayerStyles.length];

      const userMessage = [
        `다음 정보를 바탕으로 기도문을 작성해주세요:`,
        `- 이름: ${personName}`,
        `- 관계: ${relLabel}`,
        `- 기도 주제: ${topicLabel}`,
        additionalContext ? `- 추가 상황: ${additionalContext}` : "",
        `- 이번 기도 형식: ${styleHint}`,
        "",
        "위 기도 형식의 특징을 살려 새롭고 깊이 있는 기도문을 작성해주세요.",
      ].filter(Boolean).join("\n");

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: PRAYER_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.9,
        max_tokens: 700,
      });

      const prayer = completion.choices[0]?.message?.content || "";
      if (prayer) return NextResponse.json({ prayer });
    } catch {
      // Fall through to template
    }
  }

  // Fallback to templates
  const idx = variationIndex % FALLBACK_TEMPLATES.length;
  const prayer = FALLBACK_TEMPLATES[idx](personName, relLabel, topicLabel);

  return NextResponse.json({ prayer });
}
