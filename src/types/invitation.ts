export type RelationshipType =
  | "family"
  | "parent"
  | "grandparent"
  | "sibling"
  | "friend"
  | "colleague"
  | "coworker"
  | "acquaintance"
  | "neighbor"
  | "former-church-colleague";
export type InvitationLength = "short" | "medium" | "long";

export interface InvitationInput {
  personName: string; // 전도 대상자 이름 또는 호칭
  relationship: RelationshipType; // 관계
  status?: string; // 전도 진행 상태
  addressee?: string; // 호칭 커스텀
  speechStyle?: "honorific" | "casual"; // 존대/반말
  chatStyleSample?: string; // 평소 말투 샘플
  eventType: string; // 모임 종류
  date?: string; // 날짜 (선택)
  location?: string; // 장소
  additionalContext?: string; // 상황 메모 (선택)
  length?: InvitationLength; // 메시지 길이
}

export interface InvitationResult {
  message: string;
}
