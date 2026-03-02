import { PrayerTopic } from "@/types/prayer";

export interface PrayerTopicInfo {
  id: PrayerTopic;
  nameKo: string;
}

export const prayerTopics: PrayerTopicInfo[] = [
  { id: "salvation", nameKo: "구원" },
  { id: "health", nameKo: "건강" },
  { id: "family", nameKo: "가정" },
  { id: "work", nameKo: "직장" },
  { id: "peace", nameKo: "마음의 평안" },
  { id: "faith-growth", nameKo: "신앙성장" },
  { id: "relationships", nameKo: "대인관계" },
  { id: "guidance", nameKo: "인도하심" },
  { id: "gratitude", nameKo: "감사" },
];
