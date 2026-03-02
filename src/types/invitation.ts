export type RelationshipType = "family" | "friend" | "colleague" | "acquaintance";

export interface InvitationInput {
  personName: string; // 전도 대상자 이름 또는 호칭
  relationship: RelationshipType; // 관계
  eventType: string; // 모임 종류
  date?: string; // 날짜 (선택)
  location: string; // 장소
  length?: "short" | "medium" | "long"; // 메시지 길이
}

export interface InvitationResult {
  message: string;
}
