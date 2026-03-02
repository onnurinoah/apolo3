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

export type PrayerRelationship = "family" | "friend" | "colleague" | "acquaintance" | "self";

export interface PrayerInput {
  personName: string;
  relationship: PrayerRelationship;
  topic: PrayerTopic;
  additionalContext?: string;
  length?: "short" | "medium" | "long";
}

export interface PrayerResult {
  prayer: string;
}
