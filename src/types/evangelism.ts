export type EvangelismRelationship =
  | "family"
  | "friend"
  | "colleague"
  | "acquaintance"
  | "neighbor";

export interface EvangelismInput {
  targetName?: string;
  relationship: EvangelismRelationship;
  situation: string; // 현재 상황/고민
  interest: string; // 신앙에 대한 관심도/태도
  additionalContext?: string;
}

export interface EvangelismResult {
  actionPoints: string;
}
