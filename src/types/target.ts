// 전도 대상자 관리 타입

export type TargetStatus = "praying" | "approaching" | "invited" | "attending" | "decided";
export type TargetRelationship = "family" | "friend" | "colleague" | "acquaintance" | "neighbor";
export type TargetInterest = "positive" | "curious" | "neutral" | "negative" | "hurt";

export interface EvangelismTarget {
  id: string;
  name: string;
  relationship: TargetRelationship;
  situation: string;
  interest: TargetInterest;
  notes?: string;
  status: TargetStatus;
  createdAt: string; // ISO date
  prayerDates: string[]; // ISO date strings ("2026-03-02", ...)
}

// 상태 라벨·아이콘
export const STATUS_CONFIG: Record<TargetStatus, { label: string; color: string }> = {
  praying: { label: "기도 중", color: "bg-blue-100 text-blue-700" },
  approaching: { label: "접근 중", color: "bg-amber-100 text-amber-700" },
  invited: { label: "초대함", color: "bg-purple-100 text-purple-700" },
  attending: { label: "참석 중", color: "bg-green-100 text-green-700" },
  decided: { label: "결신", color: "bg-rose-100 text-rose-700" },
};

export const RELATIONSHIP_CONFIG: Record<TargetRelationship, { label: string }> = {
  family: { label: "가족" },
  friend: { label: "친구" },
  colleague: { label: "직장동료" },
  acquaintance: { label: "지인" },
  neighbor: { label: "이웃" },
};

export const INTEREST_CONFIG: Record<TargetInterest, { label: string }> = {
  positive: { label: "긍정적" },
  curious: { label: "호기심" },
  neutral: { label: "중립" },
  negative: { label: "부정적" },
  hurt: { label: "교회 상처" },
};

// 다음 액션 추천 로직용
export const NEXT_ACTIONS: Record<TargetStatus, string[]> = {
  praying: ["안부 문자 보내기", "커피 한 잔 제안하기", "기도문 작성하기"],
  approaching: ["전도 전략 확인하기", "초대 메시지 준비하기", "삶의 변화 나누기"],
  invited: ["초대 메시지 보내기", "동행할 사람 섭외하기", "교회 정보 안내하기"],
  attending: ["감사 메시지 보내기", "소그룹 초대하기", "1:1 성경공부 제안하기"],
  decided: ["양육 자료 나누기", "함께 기도하기", "새가족 소그룹 연결하기"],
};
