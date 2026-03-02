import { josa, postfix } from "@/lib/korean";

const FAMILY_TITLES = new Set([
  "엄마",
  "아빠",
  "어머니",
  "아버지",
  "할머니",
  "할아버지",
  "누나",
  "언니",
  "오빠",
  "형",
  "동생",
  "이모",
  "고모",
  "삼촌",
  "외삼촌",
  "처형",
  "장모님",
  "장인어른",
]);

export type PersonRelationship = "family" | "friend" | "colleague" | "acquaintance" | "self" | "neighbor";

export function sanitizeName(raw?: string): string {
  return (raw || "").replace(/\s+/g, " ").trim();
}

function hasHonorific(name: string): boolean {
  return name.endsWith("님") || name.endsWith("선생님");
}

export function isLikelyTitle(name: string): boolean {
  if (!name) return false;
  if (FAMILY_TITLES.has(name)) return true;
  if (name.length <= 2 && /[가-힣]/.test(name)) return true;
  return false;
}

export function toAddressee(nameRaw: string, relationship: PersonRelationship): string {
  const name = sanitizeName(nameRaw);
  if (!name) {
    if (relationship === "friend") return "친구";
    if (relationship === "family") return "가족";
    return "소중한 분";
  }

  if (relationship === "friend" && !isLikelyTitle(name) && !hasHonorific(name)) {
    return `${name}${josa(name, "아/야")}`;
  }

  if (isLikelyTitle(name)) {
    return name;
  }

  return hasHonorific(name) ? name : `${name}님`;
}

export function toReference(nameRaw: string, relationship: PersonRelationship): string {
  const name = sanitizeName(nameRaw);
  if (!name) {
    if (relationship === "family") return "가족";
    if (relationship === "friend") return "친구";
    return "소중한 분";
  }
  if (isLikelyTitle(name) || hasHonorific(name)) {
    return name;
  }
  if (relationship === "friend") {
    return name;
  }
  return `${name}님`;
}

export function objective(nameRaw: string, relationship: PersonRelationship): string {
  return postfix(toReference(nameRaw, relationship), "을/를");
}

export function subjective(nameRaw: string, relationship: PersonRelationship): string {
  return postfix(toReference(nameRaw, relationship), "이/가");
}

export function withTopic(nameRaw: string, relationship: PersonRelationship): string {
  return postfix(toReference(nameRaw, relationship), "은/는");
}

export function eventMeta(date?: string, location?: string): string {
  const parts: string[] = [];
  if (date?.trim()) parts.push(date.trim());
  if (location?.trim()) parts.push(location.trim());
  return parts.join(" · ");
}
