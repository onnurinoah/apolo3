import { josa, postfix } from "@/lib/korean";

const FAMILY_TITLES = new Set([
  "엄마",
  "아빠",
  "어머니",
  "아버지",
  "부모님",
  "할머니",
  "할아버지",
  "조부모님",
  "누나",
  "언니",
  "오빠",
  "형",
  "동생",
  "형제",
  "자매",
  "이모",
  "고모",
  "삼촌",
  "외삼촌",
  "처형",
  "장모님",
  "장인어른",
]);

export type PersonRelationship =
  | "family"
  | "friend"
  | "colleague"
  | "acquaintance"
  | "self"
  | "neighbor"
  | "parent"
  | "grandparent"
  | "sibling"
  | "coworker"
  | "former-church-colleague";

export type RelationshipProfile =
  | "parent"
  | "grandparent"
  | "sibling"
  | "family"
  | "coworker"
  | "friend"
  | "acquaintance"
  | "former-church-colleague"
  | "neighbor"
  | "self"
  | "general";

const PROFILE_LABELS: Record<RelationshipProfile, string> = {
  parent: "부모님",
  grandparent: "조부모님",
  sibling: "형제자매",
  family: "가족",
  coworker: "직장동료",
  friend: "친구",
  acquaintance: "지인",
  "former-church-colleague": "옛 교회동료",
  neighbor: "이웃",
  self: "본인",
  general: "소중한 분",
};

const PROFILE_KEYWORDS: Record<Exclude<RelationshipProfile, "general">, string[]> = {
  parent: ["엄마", "아빠", "어머니", "아버지", "부모", "부모님"],
  grandparent: ["할머니", "할아버지", "조부모", "외할머니", "외할아버지"],
  sibling: ["형", "오빠", "누나", "언니", "동생", "형제", "자매"],
  family: ["가족", "이모", "고모", "삼촌", "외삼촌", "사촌", "조카"],
  coworker: ["직장", "회사", "동료", "팀장", "사수", "부장", "과장"],
  friend: ["친구", "절친", "동창"],
  acquaintance: ["지인", "선배", "후배"],
  "former-church-colleague": [
    "옛 교회",
    "이전 교회",
    "교회 동료",
    "교회동료",
    "청년부",
    "순장",
    "셀리더",
    "집사",
    "권사",
    "장로",
    "목사",
    "전도사",
  ],
  neighbor: ["이웃", "옆집", "윗집", "아랫집"],
  self: ["본인", "나 자신", "나"],
};

export function sanitizeName(raw?: string): string {
  return (raw || "").replace(/\s+/g, " ").trim();
}

function normalizeText(raw?: string): string {
  return sanitizeName(raw).toLowerCase();
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

export function detectRelationshipProfile(input: {
  relationship?: string;
  personName?: string;
  additionalContext?: string;
}): RelationshipProfile {
  const relationship = normalizeText(input.relationship);
  const name = normalizeText(input.personName);
  const context = normalizeText(input.additionalContext);
  const joined = `${relationship} ${name} ${context}`.trim();

  if (!joined) return "general";

  if (relationship === "self") return "self";
  if (relationship === "neighbor") return "neighbor";
  if (relationship === "friend") return "friend";
  if (relationship === "colleague" || relationship === "coworker") return "coworker";
  if (relationship === "former-church-colleague") return "former-church-colleague";

  if (PROFILE_KEYWORDS.parent.some((k) => joined.includes(k))) return "parent";
  if (PROFILE_KEYWORDS.grandparent.some((k) => joined.includes(k))) return "grandparent";
  if (PROFILE_KEYWORDS.sibling.some((k) => joined.includes(k))) return "sibling";
  if (PROFILE_KEYWORDS["former-church-colleague"].some((k) => joined.includes(k))) {
    return "former-church-colleague";
  }
  if (PROFILE_KEYWORDS.coworker.some((k) => joined.includes(k))) return "coworker";
  if (PROFILE_KEYWORDS.friend.some((k) => joined.includes(k))) return "friend";
  if (PROFILE_KEYWORDS.neighbor.some((k) => joined.includes(k))) return "neighbor";
  if (PROFILE_KEYWORDS.family.some((k) => joined.includes(k))) return "family";
  if (relationship === "family") return "family";
  if (relationship === "acquaintance") return "acquaintance";

  return "acquaintance";
}

export function relationshipProfileLabel(profile: RelationshipProfile): string {
  return PROFILE_LABELS[profile] || PROFILE_LABELS.general;
}

export function toAddressee(nameRaw: string, relationship: PersonRelationship): string {
  const name = sanitizeName(nameRaw);
  if (!name) {
    if (relationship === "friend") return "친구";
    if (relationship === "family" || relationship === "parent") return "가족";
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
    if (relationship === "family" || relationship === "parent") return "가족";
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
