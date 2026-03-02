import { PrayerTopic } from "@/types/prayer";

export interface PrayerShareItem {
  id: string;
  title: string;
  request: string;
  authorName?: string;
  isAnonymous: boolean;
  targetName?: string;
  topic?: PrayerTopic | "custom";
  createdAt: string;
  prayedCount: number;
  prayedByMe: boolean;
}

export interface CreatePrayerShareInput {
  title: string;
  request: string;
  authorName?: string;
  isAnonymous?: boolean;
  targetName?: string;
  topic?: PrayerTopic | "custom";
}
