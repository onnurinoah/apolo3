export type PrayerTopic =
  | "salvation"
  | "health"
  | "family"
  | "work"
  | "peace"
  | "faith-growth"
  | "relationships"
  | "guidance"
  | "gratitude";

export type PrayerRelationship =
  | "family"
  | "parent"
  | "grandparent"
  | "sibling"
  | "friend"
  | "colleague"
  | "coworker"
  | "acquaintance"
  | "neighbor"
  | "former-church-colleague"
  | "self";
export type PrayerLength = "short" | "medium" | "long";

export interface PrayerInput {
  personName: string;
  relationship: PrayerRelationship;
  topic: PrayerTopic;
  status?: string;
  additionalContext?: string;
  length?: PrayerLength;
}

export interface PrayerResult {
  prayer: string;
}
