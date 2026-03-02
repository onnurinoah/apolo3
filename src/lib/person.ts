import { josa } from "@/lib/korean";

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

function stripParens(raw: string): string {
  return raw.replace(/\([^)]*\)/g, "").trim();
}

function extractTitle(nameRaw: string): string {
  const candidate = stripParens(sanitizeName(nameRaw));
  return FAMILY_TITLES.has(candidate) ? candidate : "";
}

function extractGivenName(nameRaw: string): string {
  const cleaned = stripParens(sanitizeName(nameRaw)).replace(/님$/g, "").trim();
  if (!cleaned) return "";
  if (extractTitle(cleaned)) return cleaned;

  const tokens = cleaned.split(" ").filter(Boolean);
  if (tokens.length >= 2) {
    if (/[가-힣]/.test(cleaned)) return tokens[tokens.length - 1];
    return tokens[0];
  }

  // 한국어 3~4글자 이름은 성(첫 글자) 제거
  if (/^[가-힣]{3,4}$/.test(cleaned)) {
    return cleaned.slice(1);
  }

  return cleaned;
}

export function isLikelyTitle(name: string): boolean {
  if (!name) return false;
  return Boolean(extractTitle(name));
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
  // 초대메시지는 명확한 호칭(엄마/아빠/할머니 등)일 때만 이름을 노출한다.
  void relationship;
  return extractTitle(nameRaw);
}

export function toReference(nameRaw: string, relationship: PersonRelationship): string {
  const title = extractTitle(nameRaw);
  if (title) return title;

  const given = extractGivenName(nameRaw);
  if (given) return `${given}(님)`;

  if (relationship === "self") return "저 자신";
  if (relationship === "friend") return "친구";
  if (
    relationship === "family" ||
    relationship === "parent" ||
    relationship === "grandparent" ||
    relationship === "sibling"
  ) {
    return "가족";
  }
  return "이 분";
}

export function toInvitationReference(nameRaw: string): string {
  const title = extractTitle(nameRaw);
  return title || "그분";
}

function particleBase(nameRaw: string, relationship: PersonRelationship): string {
  const title = extractTitle(nameRaw);
  if (title) return title;

  const given = extractGivenName(nameRaw);
  if (given) return `${given}님`;

  if (relationship === "self") return "저 자신";
  if (relationship === "friend") return "친구";
  if (
    relationship === "family" ||
    relationship === "parent" ||
    relationship === "grandparent" ||
    relationship === "sibling"
  ) {
    return "가족";
  }
  return "이 분";
}

export function objective(nameRaw: string, relationship: PersonRelationship): string {
  return `${toReference(nameRaw, relationship)}${josa(particleBase(nameRaw, relationship), "을/를")}`;
}

export function subjective(nameRaw: string, relationship: PersonRelationship): string {
  return `${toReference(nameRaw, relationship)}${josa(particleBase(nameRaw, relationship), "이/가")}`;
}

export function withTopic(nameRaw: string, relationship: PersonRelationship): string {
  return `${toReference(nameRaw, relationship)}${josa(particleBase(nameRaw, relationship), "은/는")}`;
}

export function eventMeta(date?: string, location?: string): string {
  const parts: string[] = [];
  if (date?.trim()) parts.push(date.trim());
  if (location?.trim()) parts.push(location.trim());
  return parts.join(" · ");
}
