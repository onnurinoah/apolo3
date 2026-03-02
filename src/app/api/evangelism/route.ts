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
  const nm = (targetName?: string) =>
    targetName ? toReference(targetName, relationship) : "대상자";
  const nObj = (targetName?: string) =>
    targetName ? objective(targetName, relationship) : "대상자를";
  const nSub = (targetName?: string) =>
    targetName ? subjective(targetName, relationship) : "대상자가";

  const baseHeader = [
    "전략 요약",
    `${input.relationshipLabel} 관계의 ${nm(name)} · 태도: ${input.interestLabel}`,
    `현재 상황: ${input.situation}`,
    input.additionalContext ? `추가 정보: ${input.additionalContext}` : "",
  ].filter(Boolean);

  const alt = Math.abs(Number(variationIndex) || 0) % 2;

  const sections: Record<StrategyTrack, string[]> = {
    healing: alt === 0
      ? [
          "접근 방식: 상처 치유 우선",
          "핵심 실행",
          `1. 먼저 ${nObj(name)} 설득하려 하지 말고 상처를 안전하게 말할 수 있는 분위기를 만듭니다.`,
          "2. 교회/신자에 대한 부정 경험을 변명 없이 경청하고, 공감 문장을 짧게 반복합니다.",
          "3. 신앙 대화는 짧게, 관계 돌봄은 길게 가져가며 최소 2주 단위로 안부를 유지합니다.",
          "4. 예배 초대 전, 부담 낮은 식사/산책/소모임 동행부터 제안합니다.",
          "대화 시작 예시",
          `"예전 경험이 얼마나 힘들었는지 내가 다 알 수는 없지만, 네 이야기를 가볍게 넘기고 싶지 않아."`,
          "기도 포인트",
          `- ${nSub(name)} 과거 상처를 안전하게 다룰 수 있도록 (시편 147:3)`,
          "- 내가 조급함 없이 사랑으로 동행하도록",
        ]
      : [
          "접근 방식: 관계 회복형 동행",
          "핵심 실행",
          "1. 첫 3번의 만남 목표를 '신뢰 회복'으로 고정하고 전도 성과 지표를 내려놓습니다.",
          "2. 상대가 경계하는 단어(교회, 헌신, 결단)를 초반에 반복하지 않습니다.",
          "3. 실제 도움(일정 동행, 정보 연결, 식사)을 먼저 제공합니다.",
          "4. 신앙 고백은 '내 경험' 형태로 짧게만 공유하고 답을 강요하지 않습니다.",
          "대화 시작 예시",
          `"지금 당장은 어떤 결정을 요구하고 싶지 않아. 다만 네가 안전하다고 느끼면 좋겠어."`,
          "기도 포인트",
          `- ${nObj(name)} 향한 두려움이 줄고 신뢰가 자라도록`,
          "- 복음이 강요가 아니라 위로로 경험되도록",
        ],

    "crisis-care": alt === 0
      ? [
          "접근 방식: 위기 동행형 전도",
          "핵심 실행",
          "1. 첫 메시지는 조언보다 안부와 경청 요청으로 시작합니다.",
          `2. ${input.situation}과 관련된 실제 도움 1가지를 오늘 제안합니다 (병원 동행/서류 정리/식사).`,
          "3. 마음이 안정된 뒤 10분 내 짧은 기도 제안을 합니다.",
          "4. 회복 속도에 맞춰 예배보다 소모임·짧은 방문을 먼저 제안합니다.",
          "대화 시작 예시",
          `"지금 해결책을 바로 말하기보다, 네가 버겁지 않게 오늘 하루를 같이 버텨주고 싶어."`,
          "기도 포인트",
          `- ${nSub(name)} 두려움보다 평안을 먼저 경험하도록 (빌립보서 4:7)`,
          "- 도움의 사람과 타이밍이 정확히 연결되도록",
        ]
      : [
          "접근 방식: 공감-도움-복음 3단계",
          "핵심 실행",
          "1. 공감: 감정 확인 문장 2개를 먼저 사용합니다.",
          "2. 도움: 오늘 가능한 실질 지원 1개를 제공합니다.",
          "3. 복음: '내가 붙잡은 소망'을 2-3문장으로만 공유합니다.",
          "4. 다음 만남 일정을 구체 날짜로 잡아 관계 끊김을 막습니다.",
          "대화 시작 예시",
          `"해결이 바로 안 되더라도 네가 혼자는 아니라는 걸 오늘 분명히 느끼게 해주고 싶어."`,
          "기도 포인트",
          `- ${nObj(name)} 필요한 회복 자원이 공급되도록`,
          "- 내 말보다 내 태도에서 복음이 보이도록",
        ],

    "family-discipleship": alt === 0
      ? [
          "접근 방식: 가족 관계형 전도",
          "핵심 실행",
          "1. 가족에게는 정보 전달보다 감정 안전지대를 먼저 만듭니다.",
          "2. 하루 1회 짧은 안부/감사 표현으로 대화 분위기를 바꿉니다.",
          "3. 신앙 대화는 논쟁형 질문 대신 삶의 간증형 문장으로 시작합니다.",
          "4. 가족 행사와 연결된 자연스러운 초대(식사 후 예배 동행)를 제안합니다.",
          "대화 시작 예시",
          `"내가 신앙을 말할 때 설득하려던 태도가 있었던 것 같아. 이제는 먼저 잘 듣고 싶어."`,
          "기도 포인트",
          "- 가정 안의 말투와 표정이 부드러워지도록",
          `- ${nSub(name)} 복음을 거부감보다 안정감으로 만나도록`,
        ]
      : [
          "접근 방식: 일상 루틴형 동행",
          "핵심 실행",
          "1. 주 2회 가족과의 고정 대화 시간을 먼저 확보합니다.",
          "2. 비판·교정보다 공감·격려 비율을 높여 신뢰를 회복합니다.",
          "3. 기도 제안은 짧고 간단하게(30초) 진행합니다.",
          "4. 예배 초대는 '한 번만' 제안 후 압박 없이 기다립니다.",
          "대화 시작 예시",
          `"네가 중요하게 생각하는 걸 먼저 듣고 싶어. 내가 충분히 듣지 못했던 것 같아."`,
          "기도 포인트",
          `- ${nObj(name)} 향한 내 태도가 복음적 사랑으로 정돈되도록`,
          "- 가족 대화의 문이 계속 열리도록",
        ],

    "workplace-witness": alt === 0
      ? [
          "접근 방식: 직장 신뢰형 전도",
          "핵심 실행",
          "1. 업무 신뢰(시간 준수, 약속 이행)를 전도의 첫 증거로 삼습니다.",
          "2. 점심/퇴근길 대화에서 삶의 고민을 먼저 듣고 공감합니다.",
          "3. 신앙 대화는 '내가 왜 버티는지'를 2-3문장으로 공유합니다.",
          "4. 공개적 종교 권유보다 개인적 초대 메시지로 부담을 낮춥니다.",
          "대화 시작 예시",
          `"요즘 일이 많아서 마음이 무거울 때가 있는데, 나는 기도로 중심을 다시 잡곤 해."`,
          "기도 포인트",
          `- ${nSub(name)} 직장 압박 속에서도 마음의 쉼을 경험하도록`,
          "- 내 직장 태도에서 신뢰가 먼저 세워지도록",
        ]
      : [
          "접근 방식: 실무 동행형 접근",
          "핵심 실행",
          "1. 상대의 현재 업무 부담을 구체적으로 파악합니다.",
          "2. 도울 수 있는 업무/정보 지원 1건을 먼저 제공합니다.",
          "3. 신앙 주제는 질문이 나올 때만 확장하고, 길게 밀어붙이지 않습니다.",
          "4. '짧게 다녀오기 좋은 모임' 프레이밍으로 초대를 제안합니다.",
          "대화 시작 예시",
          `"요즘 프로젝트 때문에 많이 지치지? 내가 도움 될 수 있는 부분이 있으면 같이 해보자."`,
          "기도 포인트",
          `- ${nObj(name)} 실제 도움을 통해 마음 문이 열리도록`,
          "- 직장 대화 속에서 지혜와 온유를 잃지 않도록",
        ],

    intellectual: alt === 0
      ? [
          "접근 방식: 질문 환영형 변증 전도",
          "핵심 실행",
          "1. 상대 질문을 반박 대상이 아니라 탐구 주제로 재구성합니다.",
          "2. 매 대화마다 핵심 논점 1개만 다뤄 과부하를 막습니다.",
          "3. 근거: 우주 기원/도덕 근거/예수 부활 역사성 순으로 단계화합니다.",
          "4. 답을 단정하기보다 함께 읽을 자료를 제안합니다.",
          "대화 시작 예시",
          `"좋은 질문이야. 우리 이 주제는 오늘 하나만 정해서 같이 검토해 볼래?"`,
          "기도 포인트",
          `- ${nSub(name)} 지적 정직함 속에서 복음의 신뢰성을 보도록`,
          "- 내가 방어적 태도 대신 학습형 태도를 유지하도록",
        ]
      : [
          "접근 방식: DB 우선 변증 동행",
          "핵심 실행",
          "1. 질문을 기록해 변증 DB에서 유사 항목을 먼저 찾습니다.",
          "2. 답변은 2-4문장 핵심 요약으로 시작합니다.",
          "3. 추가 질문이 나오면 근거 1개만 더해 단계적으로 확장합니다.",
          "4. 대화 후 요약 메시지로 핵심을 재정리합니다.",
          "대화 시작 예시",
          `"오늘 질문 핵심은 '근거가 있는가'로 보이네. 내가 짧게 요약해서 먼저 공유해볼게."`,
          "기도 포인트",
          `- ${nObj(name)} 묻는 태도가 진리 탐구로 이어지도록`,
          "- 내가 정확성과 존중을 함께 지키도록",
        ],

    "gospel-bridge": alt === 0
      ? [
          "접근 방식: 복음 브릿지 직접 전개",
          "핵심 실행",
          "1. 관심이 높을 때는 복음 핵심(창조-타락-구속-응답)을 명확히 설명합니다.",
          `2. ${input.situation}과 복음을 연결해 '지금 필요한 소망'으로 제시합니다.`,
          "3. 결단 압박 대신 '한 단계 응답'을 제안합니다 (예: 함께 기도 1회).",
          "4. 다음 만남에서 질문 1개를 반드시 이어갑니다.",
          "대화 시작 예시",
          `"네가 요즘 찾는 답이 뭔지 들으면서, 내가 왜 복음을 소망으로 믿게 됐는지 짧게 나눠보고 싶어."`,
          "기도 포인트",
          `- ${nSub(name)} 복음을 정보가 아닌 초대로 듣도록`,
          "- 내가 결단을 강요하지 않고 진실하게 안내하도록",
        ]
      : [
          "접근 방식: 간증 연결형 복음 제시",
          "핵심 실행",
          "1. 60초 개인 간증(전/중/후)으로 대화를 시작합니다.",
          "2. 간증 뒤 상대의 반응을 먼저 듣고 핵심 질문 1개를 받습니다.",
          "3. 질문에 답한 뒤 짧은 기도 제안을 합니다.",
          "4. 예배/모임 초대는 '가볍게 와보기' 수준으로 제안합니다.",
          "대화 시작 예시",
          `"나도 비슷한 시기에 답답했는데, 복음을 이해하면서 중심이 바뀌었어. 너 생각도 듣고 싶어."`,
          "기도 포인트",
          `- ${nObj(name)} 향한 복음 설명이 분명하고 간결하도록`,
          "- 성령께서 마음의 결단을 주도하시도록",
        ],

    "long-term": alt === 0
      ? [
          "접근 방식: 장기 인내형 관계 전도",
          "핵심 실행",
          "1. 당장 설득 목표를 내려놓고 4주 관계 루틴을 설계합니다.",
          "2. 안부 메시지-만남-후속 안부의 반복 패턴을 고정합니다.",
          "3. 신앙 언급 빈도는 낮추되 삶의 성실함 증거는 높입니다.",
          "4. 거절 반응 뒤 즉시 재권유하지 않고 간격을 둡니다.",
          "대화 시작 예시",
          `"네 생각을 존중하고 싶어. 결론을 강요하지 않고 오래 친구로 곁에 있을게."`,
          "기도 포인트",
          `- ${nSub(name)} 경계심이 완만하게 풀리도록`,
          "- 내가 결과 집착 대신 충성에 집중하도록",
        ]
      : [
          "접근 방식: 저항 완충형 접근",
          "핵심 실행",
          "1. 상대가 싫어하는 전도 방식 목록을 먼저 파악합니다.",
          "2. 피해야 할 방식은 완전히 중단하고 관계 회복 신호를 보냅니다.",
          "3. 공통 관심사 기반 만남을 통해 대화 마찰을 줄입니다.",
          "4. 신뢰 회복 후 신앙 질문이 나오면 짧게만 답합니다.",
          "대화 시작 예시",
          `"내가 불편하게 했던 방식이 있다면 먼저 바꾸고 싶어. 네가 편한 방식으로 대화하자."`,
          "기도 포인트",
          `- ${nObj(name)} 향한 관계의 긴장이 완화되도록`,
          "- 내 말이 아니라 삶의 열매가 먼저 보이도록",
        ],

    oikos: alt === 0
      ? [
          "접근 방식: 오이코스 관계 전도",
          "핵심 실행",
          "1. 생활 반경 안에서 자연스러운 만남 빈도를 확보합니다.",
          "2. 상대 필요를 파악해 작은 도움을 먼저 제공합니다.",
          `3. ${input.situation}에 공감하는 대화로 신뢰를 쌓습니다.`,
          "4. 분위기가 열리면 부담 낮은 모임부터 초대합니다.",
          "대화 시작 예시",
          `"요즘 어떻게 지내는지 궁금했어. 네 이야기를 먼저 충분히 듣고 싶어."`,
          "기도 포인트",
          `- ${nSub(name)} 일상 속에서 하나님의 선하심을 보도록`,
          "- 관계의 문이 자연스럽게 열리도록",
        ]
      : [
          "접근 방식: 신뢰-대화-초대 3단계",
          "핵심 실행",
          "1. 신뢰: 약속을 지키는 작은 행동을 반복합니다.",
          "2. 대화: 상대 관심사 중심으로 경청 비율을 높입니다.",
          "3. 초대: 모임 목적과 분위기를 짧고 명확하게 안내합니다.",
          "4. 후속: 만남 뒤 24시간 내 피드백 메시지를 보냅니다.",
          "대화 시작 예시",
          `"최근에 네가 고민하는 부분을 들으면서, 내가 도움 될 수 있는 부분이 있는지 계속 생각했어."`,
          "기도 포인트",
          `- ${nObj(name)} 향한 내 관심이 진심으로 전달되도록`,
          "- 작은 접점이 복음 대화로 이어지도록",
        ],
  };

  return [...baseHeader, "", ...sections[track]].join("\n");
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

function sanitizeRelation(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "관계 미입력";
  return value;
}
