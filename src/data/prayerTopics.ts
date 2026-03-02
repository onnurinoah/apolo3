import { PrayerTopic } from "@/types/prayer";

export interface PrayerTopicInfo {
  id: PrayerTopic;
  nameKo: string;
  icon: string;
}

export const prayerTopics: PrayerTopicInfo[] = [
  { id: "salvation", nameKo: "구원", icon: "" },
  { id: "health", nameKo: "건강", icon: "" },
  { id: "family", nameKo: "가정", icon: "" },
  { id: "work", nameKo: "직장", icon: "" },
  { id: "peace", nameKo: "마음의 평안", icon: "" },
  { id: "faith-growth", nameKo: "신앙성장", icon: "" },
  { id: "relationships", nameKo: "대인관계", icon: "" },
  { id: "guidance", nameKo: "인도하심", icon: "" },
  { id: "gratitude", nameKo: "감사", icon: "" },
];
