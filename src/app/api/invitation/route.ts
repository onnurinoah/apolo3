import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import { INVITATION_PROMPT } from "@/lib/prompts";
import { josa } from "@/lib/korean";

const RELATIONSHIP_LABELS: Record<string, string> = {
  family: "가족",
  friend: "친구",
  colleague: "직장동료",
  acquaintance: "지인",
};

// 이름이 있을 때/없을 때를 구분하는 헬퍼
const n = (name: string, fallback: string) => name || fallback;

// 12개 다양한 초대 메시지 템플릿
const FALLBACK_TEMPLATES = [
  // 1. 친구 - 자연스러운 일상 대화형
  (name: string, rel: string, event: string, date: string, loc: string) => {
    const nm = n(name, "친구");
    const isFriend = rel === "친구";
    return `${nm}${isFriend ? josa(nm, "아/야") : "님"}, 오랜만이야 😊\n\n요즘 어떻게 지내? 갑자기 연락한 이유가 있어서ㅎㅎ\n\n이번 ${date}에 우리 교회에서 ${event}${josa(event, "이/")} 있는데, ${nm}${isFriend ? "도" : "님도"} 한번 와줄 수 있어? 분위기 진짜 좋거든!\n\n📍 ${loc}\n\n부담 없이 생각해보고 알려줘! 내가 같이 있을게 ☺️`;
  },

  // 2. 친구 - 힘든 시기에 함께하자
  (name: string, rel: string, event: string, date: string, loc: string) => {
    const nm = n(name, "친구");
    const isFriend = rel === "친구";
    return `${nm}${isFriend ? josa(nm, "아/야") : "님"} 💛\n\n요즘 많이 힘들다고 했잖아. 나도 예전에 그런 시기가 있었는데, 그때 교회에서 정말 많이 위로받았거든.\n\n이번 ${date}에 ${event}${josa(event, "이/")} 있는데, 부담 갖지 말고 그냥 쉬러 간다는 느낌으로 한번만 와줄 수 있어?\n\n📍 ${loc}\n\n${nm}${isFriend ? "가" : "님이"} 와줬으면 좋겠다 🙏`;
  },

  // 3. 가족 - 따뜻하고 진심 어린 톤
  (name: string, _rel: string, event: string, date: string, loc: string) => {
    const nm = n(name, "");
    return `${nm ? `${nm}${josa(nm, "아/야")}, ` : ""}나 요즘 교회 다니는 거 알지? 💕\n\n이번에 ${event}${josa(event, "이/")} 있는데, 한번만 같이 가줬으면 해서.\n\n억지로는 아니고, 그냥 한 번만! 내가 진짜 소중하게 생각하는 공간인데 같이 있어줬으면 해.\n\n📅 ${date}\n📍 ${loc}\n\n생각해봐 🙏`;
  },

  // 4. 직장동료 - 예의 바르고 부담 없는 톤
  (name: string, _rel: string, event: string, date: string, loc: string) => {
    const nm = n(name, "");
    return `안녕하세요${nm ? ` ${nm}님` : ""}! 갑자기 연락드려서 죄송해요 😊\n\n다름이 아니라 이번 ${date}에 저희 교회에서 ${event}${josa(event, "이/")} 있어서요. 혹시 시간 되시면 한번 오셔보시겠어요?\n\n📍 ${loc}\n\n제가 같이 갈게요! 부담 없이 편하게 생각해 주세요 🕊️`;
  },

  // 5. 지인 - 정중하고 자연스럽게
  (name: string, _rel: string, event: string, date: string, loc: string) => {
    const nm = n(name, "");
    return `${nm ? `${nm}님, ` : ""}안녕하세요! 😊\n\n평소에 한번 초대드리고 싶었는데, 이번 ${date}에 좋은 기회가 생겨서 연락드렸어요.\n\n저희 교회 ${event}${josa(event, "이/")} 있는데, 한번 오셔서 좋은 시간 보내시면 어떨까 해서요.\n\n📍 ${loc}\n\n부담 없이 한번 오시면 좋겠습니다 🙏`;
  },

  // 6. 오랜만에 연락 재개형
  (name: string, rel: string, event: string, date: string, loc: string) => {
    const nm = n(name, "친구");
    const isFriend = rel === "친구";
    return `${nm}${isFriend ? josa(nm, "아/야") : "님"}, 오랫동안 연락을 못 했네 😅\n\n갑자기 연락한 이유가 있어서. 이번에 우리 교회 ${event}${josa(event, "이/")} 있거든. 오랜만에 얼굴도 보고 이야기도 나누면 좋을 것 같아서!\n\n📅 ${date} | 📍 ${loc}\n\n올 수 있으면 연락 줘 😊`;
  },

  // 7. MZ 감성 - 짧고 친근하게
  (name: string, rel: string, event: string, date: string, loc: string) => {
    const nm = n(name, "친구");
    const isFriend = rel === "친구";
    return `${nm}${isFriend ? josa(nm, "아/야") : "님"}! 🙌\n\n갑자기 뭔 소리냐 할 수 있는데 ㅋㅋ\n이번 ${date}에 ${event} 있거든, ${loc}에서.\n\n분위기 진짜 좋아~ 억지로 뭔가 하는 자리 아니고 그냥 편하게. 한번만 와봐! ✨`;
  },

  // 8. 간증형 - 자신의 변화를 나누며
  (name: string, rel: string, event: string, date: string, loc: string) => {
    const nm = n(name, "");
    const isFriend = rel === "친구";
    const suffix = nm ? (isFriend ? `${nm}${josa(nm, "한테도")}` : `${nm}님께도`) : "당신께도";
    return `${nm ? `${nm}${isFriend ? josa(nm, "아/야") : "님"}! ✨\n\n` : ""}나 요즘 교회 다니면서 진짜 많이 달라졌거든.\n\n${suffix} 이런 따뜻한 경험 나눠주고 싶어서, 이번 ${date} ${event}에 초대하고 싶어!\n\n📍 ${loc}\n\n한번만 와봐~ 분위기 느끼면 알 거야 😄`;
  },

  // 9. 솔직한 고백형
  (name: string, rel: string, event: string, date: string, loc: string) => {
    const nm = n(name, "");
    const isFriend = rel === "친구";
    const callout = nm ? `${nm}${isFriend ? josa(nm, "아/야") : "님"}, ` : "";
    return `${callout}솔직히 말하면 이 말 꺼내기 좀 오래 고민했어 😅\n\n나한테 교회가 정말 소중한 곳이거든. 이번 ${event}, ${date}에 ${loc}에서 하는데, ${nm ? (isFriend ? `${nm}이` : `${nm}님이`) : "네가"} 한번 와줬으면 해서.\n\n억지로 믿으라는 게 아니라, 그냥 한번 경험해봤으면 해서야. 올 수 있어? 🙏`;
  },

  // 10. 짧고 가벼운 초대형 (거부감 있는 상대용)
  (name: string, rel: string, event: string, date: string, loc: string) => {
    const nm = n(name, "");
    const isFriend = rel === "친구";
    const callout = nm ? `${nm}${isFriend ? josa(nm, "아/야") : "님"}, ` : "";
    return `${callout}혹시 ${date}에 시간 돼? 😊\n\n교회에서 ${event}${josa(event, "이/")} 있는데, 같이 가면 어떨까 해서. ${loc}에서 해!\n\n부담은 전혀 없어. 올 수 있으면 알려줘~`;
  },

  // 11. 위로와 공동체 제안형
  (name: string, _rel: string, event: string, date: string, loc: string) => {
    const nm = n(name, "");
    return `${nm ? `${nm}님, ` : ""}안녕하세요. 요즘 어떻게 지내세요?\n\n좋은 자리가 생겨서 초대드리고 싶었어요. 이번 ${date}에 저희 교회 ${event}${josa(event, "이/")} 있는데요, 강압적인 자리가 아니라 그냥 따뜻하게 쉬어갈 수 있는 공간이에요.\n\n📍 ${loc}\n\n한번 오시겠어요? 제가 같이 갈게요 🕊️`;
  },

  // 12. 특별한 의미 강조형 (명절·기념일·특별예배)
  (name: string, rel: string, event: string, date: string, loc: string) => {
    const nm = n(name, "");
    const isFriend = rel === "친구";
    const callout = nm ? `${nm}${isFriend ? josa(nm, "아/야") : "님"} 💕\n\n` : "";
    return `${callout}이번 ${date}에 우리 교회에서 ${event}${josa(event, "이/")} 있어.\n\n평소보다 더 특별하고 따뜻한 자리가 될 것 같아서, 너한테 꼭 알려주고 싶었어.\n\n📍 ${loc}\n\n같이 가줄 수 있어? 네가 오면 나도 너무 기쁠 것 같아 🌟`;
  },
];

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    personName = "",
    relationship,
    eventType,
    date,
    location = "",
    variationIndex = 0,
  } = body;

  const relLabel = RELATIONSHIP_LABELS[relationship] || relationship;

  // Try AI first
  const openai = getOpenAIClient();
  if (openai) {
    try {
      const namePart = personName ? `- 이름: ${personName}` : "- 이름: 미입력(이름 없이 자연스럽게 작성)";
      const locPart = location ? `- 장소: ${location}` : "- 장소: 미입력(장소 언급 생략)";
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: INVITATION_PROMPT },
          {
            role: "user",
            content: `다음 정보로 1:1 전도 카카오톡 초대 메시지를 작성해주세요 (${variationIndex + 1}번째 변형):\n${namePart}\n- 관계: ${relLabel}\n- 모임명: ${eventType}\n- 날짜: ${date}\n${locPart}\n\n이전과 다른 새로운 감성과 스타일로 작성해주세요.`,
          },
        ],
        temperature: 0.95,
        max_tokens: 500,
      });

      const message = completion.choices[0]?.message?.content || "";
      if (message) return NextResponse.json({ message });
    } catch {
      // Fall through to template
    }
  }

  // Fallback to templates
  const idx = variationIndex % FALLBACK_TEMPLATES.length;
  const message = FALLBACK_TEMPLATES[idx](
    personName,
    relLabel,
    eventType,
    date,
    location
  );

  return NextResponse.json({ message });
}
