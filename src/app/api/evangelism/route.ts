import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import { EVANGELISM_PROMPT } from "@/lib/prompts";
import { josa, postfix } from "@/lib/korean";

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
  hurt: "교회에 상처받은 경험 있음",
};

// 이름 헬퍼: 이름이 없으면 "대상자" 사용
const nm = (name: string | undefined) => name || "대상자";
const nmP = (name: string | undefined) => name ? postfix(name, "을/를") : "대상자를";
const nmI = (name: string | undefined) => name ? name + josa(name, "이/") : "대상자가";
const nmN = (name: string | undefined) => name ? name + josa(name, "은/는") : "대상자는";

// 6개 심층 전도전략 템플릿 (오이코스, EE, 위기, 지식형, 교회상처, 장기관계)
const FALLBACK_TEMPLATES = [

  // 1. 오이코스 전도 (Oikos) - 자연스러운 관계망 접근
  (name: string | undefined, rel: string, situation: string, _interest: string) =>
    `📋 전도 전략 요약\n[오이코스 관계 전도] ${rel}${josa(rel, "으로/로")}서 이미 신뢰 관계가 형성된 ${nm(name)}에게 가장 효과적인 전도는 강요 없는 삶의 동행입니다. 현재 ${situation} 상황이 마음의 문을 여는 자연스러운 기회가 될 수 있습니다.\n\n🎯 액션포인트\n\n1️⃣ 이번 주 밥 한 끼 또는 커피 약속 잡기\n전도보다 관계가 먼저입니다. 지금 당장 만남을 계획하세요. ${situation} 상황을 겪고 있다면 "최근에 어떻게 지냈어?" 한 마디가 마음을 엽니다.\n\n2️⃣ 필요를 파악하고 실질적으로 돕기\n지금 ${nm(name)}에게 가장 필요한 것이 무엇인지 물어보고 행동으로 보여주세요.\n"사랑은 말과 혀로만 하지 말고 행함과 진실함으로 하자" (요한일서 3:18)\n\n3️⃣ 자신의 변화를 자연스럽게 나누기\n"요즘 내가 좀 달라진 것 같다는 말 들었어?" 식으로 먼저 삶의 변화를 꺼내 관심을 유도하세요.\n\n4️⃣ 낮은 문턱의 자리부터 초대\n대예배보다 소그룹 모임, 문화 행사, 식사 교제처럼 부담이 작은 자리부터 초대하세요.\n\n💡 대화 시작 예시\n"요즘 어때? 나는 요즘 생각보다 마음이 많이 안정됐는데, 사실 어디서 오는지 이야기해줄 수 있어?"\n\n🙏 기도 포인트\n- ${nmI(name)} 마음 밭을 성령님이 부드럽게 하시도록 (에스겔 36:26)\n- ${nmP(name)} 향한 진심 어린 관심이 내 안에서 자라도록\n- 자연스러운 복음 나눔의 문이 열리도록`,

  // 2. EE식 접근 (Evangelism Explosion) - 긍정적·호기심 있는 상대
  (name: string | undefined, rel: string, situation: string, _interest: string) =>
    `📋 전도 전략 요약\n[복음 직접 전달 접근] ${rel} ${nmN(name)} 신앙에 관심을 보이거나 마음이 열려있는 상태입니다. 자연스러운 대화 속에서 복음의 핵심을 직접 나눌 적기입니다.\n\n🎯 액션포인트\n\n1️⃣ 영적 관심도를 확인하는 질문으로 시작\n"혹시 하나님이나 종교에 대해 생각해본 적 있어?"\n"만약 오늘 죽는다면, 천국에 갈 수 있다고 생각해? 왜 그렇게 생각해?"\n이 두 질문은 자연스럽게 복음으로 연결됩니다.\n\n2️⃣ 브릿지 복음 나누기\n하나님 ←── 죄로 인한 단절 ──→ 사람\n         ↓↓↓ 예수님의 십자가 ↓↓↓\n"죄의 삯은 사망이요 하나님의 은사는 그리스도 예수 우리 주 안에 있는 영생이니라" (로마서 6:23)\n\n3️⃣ ${situation} 상황과 복음 연결\n현재 ${nmI(name)} 겪는 상황에 복음이 실질적 답이 됨을 보여주세요. "나도 비슷한 때 이 말씀이 정말 위로가 됐어" 하고 자신의 이야기를 먼저 나누세요.\n\n4️⃣ 반응을 들은 후 소그룹 또는 1:1 성경 공부 제안\n관심을 보이면 큰 예배보다 소그룹이나 1:1 탐구 모임을 먼저 권해보세요.\n\n💡 대화 시작 예시\n"나 요즘 교회 나가면서 정말 많이 변했거든. 30분만 시간 내줄 수 있어? 내 이야기 들어봐."\n\n🙏 기도 포인트\n- 성령님이 ${nmI(name)} 마음에 죄와 의와 심판을 깨닫게 하시도록 (요한복음 16:8)\n- 내가 복음을 담대하고 자연스럽게 전할 수 있도록 (골로새서 4:3)\n- 이 대화 이후에도 복음의 씨앗이 ${nm(name)} 안에서 자라도록`,

  // 3. 위기 전도 - 어려운 상황에 처한 상대
  (name: string | undefined, rel: string, situation: string, _interest: string) =>
    `📋 전도 전략 요약\n[위기 동행 전도] ${nmN(name)} 현재 ${situation}${josa(situation, "으로/로")} 힘든 시기를 보내고 있습니다. 위기는 하나님이 사람 마음을 여시는 순간이 될 수 있습니다. 지금은 말보다 존재가 먼저입니다.\n\n🎯 액션포인트\n\n1️⃣ 판단 없이 곁에 있기\n지금 당장 복음을 전하려 하지 마세요. 먼저 들어주고, 인정해주고, 함께 있어주세요.\n"슬퍼하는 자들과 함께 슬퍼하라" (로마서 12:15)\n→ 오늘 당장 연락하세요: "요즘 어때? 생각나서 연락했어."\n\n2️⃣ 구체적인 실질적 도움 제공\n밥 챙겨주기, 심부름, 같이 병원 동행 등 직접적 도움이 가장 강한 복음 증거입니다. "${situation} 상황에서 내가 뭘 도와줄 수 있을까?" 하고 직접 물어보세요.\n\n3️⃣ 소망을 조심스럽게 나누기\n관계가 안정되면 자연스럽게 제안하세요:\n"나는 이런 힘든 시기에 기도가 정말 도움이 됐어. 같이 기도해줄까?"\n\n4️⃣ 교회 공동체의 따뜻함 연결\n개인의 돌봄을 넘어, 공동체의 지지가 살아있는 복음의 증거가 됩니다.\n\n💡 대화 시작 예시\n"많이 힘들지? 아무 말 안 해도 돼. 그냥 같이 있어줄게."\n(복음 이야기는 나중에 — 지금 존재 자체가 전도입니다)\n\n🙏 기도 포인트\n- ${nm(name)}의 고통 가운데 하나님의 위로가 실제로 임하도록 (고린도후서 1:4)\n- 이 위기가 ${nmI(name)} 하나님을 찾는 전환점이 되도록\n- 내가 온전한 사랑과 인내로 ${nm(name)} 곁에 있을 수 있도록`,

  // 4. 지식형·이성적 접근 - 지적 회의주의자
  (name: string | undefined, rel: string, _situation: string, _interest: string) =>
    `📋 전도 전략 요약\n[지성 기반 전도] ${rel} ${nmN(name)} 이성적이고 논리적인 성향을 가진 것으로 보입니다. 감성적 접근보다 증거 기반의 지적 탐구 방식이 효과적입니다.\n\n🎯 액션포인트\n\n1️⃣ 질문에 질문으로 답하기\n"좋은 질문이야, 나도 그게 궁금했었어" 하고 함께 탐구하는 자세를 취하세요. 기독교는 질문을 환영합니다.\n→ 방어적 답변 대신 "같이 생각해보자"는 태도가 신뢰를 만듭니다.\n\n2️⃣ 변증학적 논점 활용\n• 우주론적 논증: "왜 아무것도 없지 않고 무언가가 존재하는가?"\n• 도덕 논증: "보편적 선악의 기준은 어디서 오는가?"\n• 역사적 증거: 예수 부활의 역사적 사실성 (공허한 무덤, 목격자들)\n→ 📚 C.S. 루이스 <순전한 기독교>를 자연스럽게 선물해보세요.\n\n3️⃣ 자신의 지적 여정 나누기\n"나도 처음엔 안 믿었는데, 공부할수록 오히려 확신이 생겼어" 하고 자신의 이야기를 먼저 나누세요.\n\n4️⃣ 알파코스·변증학 강좌 초대\n"한번 같이 토론해볼 수 있는 자리가 있는데, 관심 있어?" 하고 지성적 탐구 공간으로 초대하세요.\n\n💡 대화 시작 예시\n"나 요즘 기독교 공부하고 있는데 사실 꽤 논리적이더라고. 관심 있어? 같이 이야기해봐도 재밌을 것 같아서."\n\n🙏 기도 포인트\n- ${nm(name)}의 지성이 진리를 가리는 방해물이 아닌 통로가 되도록\n- 내가 지혜롭고 온유하게 대답할 수 있도록 (베드로전서 3:15)\n- 성령님이 ${nmI(name)} 마음 안에서 증거의 역사를 행하시도록`,

  // 5. 교회 상처 회복 전도 - 교회에 상처받은 상대
  (name: string | undefined, _rel: string, _situation: string, _interest: string) =>
    `📋 전도 전략 요약\n[치유 중심 전도] ${nmN(name)} 교회나 기독교인으로부터 상처받은 경험이 있습니다. 먼저 그 상처를 충분히 인정하고 들어주는 것이 가장 중요한 첫 단계입니다.\n\n🎯 액션포인트\n\n1️⃣ 상처를 먼저 인정하기\n"맞아, 그건 잘못된 거야. 그런 일이 있었다면 상처받는 게 당연해."\n변호하거나 설명하려 하지 마세요. 먼저 공감이 먼저입니다.\n\n2️⃣ 예수님과 교회·종교를 분리하기\n"예수님은 그런 분이 아니야"라고 강요하지 말고, 당신의 삶으로 보여주세요. 말보다 삶이 더 설득력 있습니다.\n"상한 갈대를 꺾지 아니하며 꺼져가는 심지를 끄지 아니하고" (이사야 42:3)\n\n3️⃣ 압박 없는 관계 유지\n절대 전도 목적이 있다는 인상을 주지 마세요. 그냥 진심으로 ${nmP(name)} 친구로 대하세요. 하나님의 때가 있습니다.\n\n4️⃣ 건강한 공동체를 보여주기\n시간이 지나면, 상처를 준 곳과 다른 따뜻한 교회 사람들을 자연스럽게 소개하세요. 이것이 가장 강력한 설득입니다.\n\n💡 대화 시작 예시\n"나 교회 다니는 거 알지? 근데 네가 예전에 교회에서 힘들었다고 했잖아. 솔직히 그런 일이 있었다면 상처받는 게 당연한 거야. 그게 어땠는지 이야기해줄 수 있어?"\n\n🙏 기도 포인트\n- ${nm(name)}의 상처가 하나님 앞에서 치유되도록 (시편 147:3)\n- 내가 예수님의 진짜 모습을 삶으로 보여줄 수 있도록\n- ${nmI(name)} 교회가 아닌 예수님을 만나는 날이 오도록`,

  // 6. 장기 관계 전도 - 부정적·저항적 상대
  (name: string | undefined, _rel: string, _situation: string, _interest: string) =>
    `📋 전도 전략 요약\n[장기 인내 전도] ${nmN(name)} 신앙에 거부감이 있거나 저항적인 태도를 보입니다. 서두르지 않는 장기적 접근이 필요합니다. 씨앗을 뿌리고 하나님이 자라게 하십니다.\n\n🎯 액션포인트\n\n1️⃣ 지금 당장의 전도 목표를 내려놓기\n역설적이지만, 당장의 전도를 목표에서 내려놓으세요. ${nmP(name)} 진심으로 사랑하고 친구로 대하는 것 자체가 복음입니다.\n"나는 심었고 아볼로는 물을 주었으되 오직 하나님께서 자라나게 하셨나니" (고린도전서 3:6)\n\n2️⃣ 월 1-2회 정기적인 만남 유지\n꾸준한 관계가 신뢰를 만들고, 신뢰가 복음의 토양입니다. 지금 당장 이번 달 약속을 잡아보세요.\n\n3️⃣ 삶으로 증거하기\n기쁠 때 감사하고, 힘들 때 기도한다고 말하고, 용서하고 섬기는 삶을 보여주세요.\n${nmI(name)} "저 사람은 왜 저럴까?" 궁금해할 때가 기회입니다.\n\n4️⃣ 일상 속에 자연스러운 신앙 언급\n강요 없이 "어제 교회에서 좋은 이야기 들었어"처럼 일상에 신앙을 자연스럽게 녹여내세요.\n\n5️⃣ 꾸준한 중보기도\n보이지 않지만 가장 강력한 전도입니다. ${nm(name)}를 위해 매일 기도하세요.\n\n💡 지금 당장 할 일\n전도 대화가 아닌 안부 문자 한 통을 보내보세요:\n"요즘 어때? 생각나서 연락해봤어 😊"\n\n🙏 기도 포인트\n- 내가 조급해하지 않고 하나님의 타이밍을 기다릴 수 있도록\n- ${nm(name)}의 마음이 서서히 부드러워지도록 (에스겔 36:26)\n- ${nm(name)}의 삶 가운데 하나님이 직접 역사하시도록`,
];

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    targetName = "",
    relationship,
    situation,
    interest,
    additionalContext,
    variationIndex = 0,
  } = body;

  const relLabel = RELATIONSHIP_LABELS[relationship] || relationship;
  const interestLabel = INTEREST_LABELS[interest] || interest;

  // Try AI first
  const openai = getOpenAIClient();
  if (openai) {
    try {
      const namePart = targetName
        ? `- 전도 대상자 이름: ${targetName}`
        : "- 전도 대상자 이름: 미입력(이름 언급 생략)";

      const userMessage = [
        `다음 정보를 바탕으로 전도 전략을 작성해주세요 (${variationIndex + 1}번째 변형):`,
        namePart,
        `- 관계: ${relLabel}`,
        `- 현재 상황: ${situation}`,
        `- 신앙에 대한 태도: ${interestLabel}`,
        additionalContext ? `- 추가 정보: ${additionalContext}` : "",
        "",
        "이전과 다른 새로운 관점과 전략으로 작성해주세요.",
      ].filter(Boolean).join("\n");

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: EVANGELISM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.9,
        max_tokens: 1000,
      });

      const actionPoints = completion.choices[0]?.message?.content || "";
      if (actionPoints) return NextResponse.json({ actionPoints });
    } catch {
      // Fall through to template
    }
  }

  // Fallback to templates
  const idx = variationIndex % FALLBACK_TEMPLATES.length;
  const actionPoints = FALLBACK_TEMPLATES[idx](
    targetName || undefined,
    relLabel,
    situation,
    interestLabel
  );

  return NextResponse.json({ actionPoints });
}
