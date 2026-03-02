/**
 * 한국어 조사 자동 교정 유틸리티
 * 앞 글자의 받침 유무에 따라 올바른 조사를 선택합니다.
 */

/** 마지막 글자에 받침이 있는지 확인 (ㄹ 받침 여부도 반환) */
function getJongseong(char: string): { has: boolean; isRieul: boolean } {
  const code = char.charCodeAt(0);
  // 한글 유니코드 범위: 0xAC00 ~ 0xD7A3
  if (code < 0xac00 || code > 0xd7a3) {
    // 숫자 처리: 0,1,3,6,7,8 은 받침 있음
    if (/[0-9]/.test(char)) {
      const batchimDigits = ["0", "1", "3", "6", "7", "8"];
      return { has: batchimDigits.includes(char), isRieul: char === "8" };
    }
    // 영문 등 기타 → 받침 없음으로 처리
    return { has: false, isRieul: false };
  }
  const jongseong = (code - 0xac00) % 28;
  return { has: jongseong > 0, isRieul: jongseong === 8 };
}

function lastChar(str: string): string {
  const trimmed = str.trim();
  return trimmed.charAt(trimmed.length - 1);
}

type ParticlePair = [string, string]; // [받침 있을 때, 받침 없을 때]

const PARTICLE_MAP: Record<string, ParticlePair> = {
  "은/는": ["은", "는"],
  "이/가": ["이", "가"],
  "을/를": ["을", "를"],
  "과/와": ["과", "와"],
  "와/과": ["과", "와"],
  "아/야": ["아", "야"],
  "이랑/랑": ["이랑", "랑"],
  "으로/로": ["으로", "로"], // ㄹ 받침은 "로" 사용 (특수)
  "이/": ["이", ""],
  "이에/에": ["이에", "에"],
  "이는/는": ["이는", "는"],
};

/**
 * 단어 뒤에 올바른 조사를 붙여서 반환
 * @example postfix("철수", "은/는") → "철수는"
 * @example postfix("영희", "을/를") → "영희를"
 * @example postfix("주일예배", "이/가") → "주일예배가"
 */
export function postfix(word: string, particle: string): string {
  const pair = PARTICLE_MAP[particle];
  if (!pair) return word + particle;

  const { has, isRieul } = getJongseong(lastChar(word));

  // "으로/로" 특수 처리: ㄹ 받침이면 "로"
  if (particle === "으로/로" && isRieul) {
    return word + "로";
  }

  return word + (has ? pair[0] : pair[1]);
}

/**
 * 템플릿 문자열 내의 조사 패턴을 자동 교정
 * 패턴: {단어}(은/는), {단어}(을/를) 등
 * 또는 직접 텍스트에서 "단어을(를)" → "단어를" 형태로 교정
 */
export function fixParticles(text: string): string {
  let result = text;

  // 일반적인 "(을/를)" 패턴 교정: "단어을(를)" or "단어를(을)" → 올바른 조사
  result = result.replace(
    /([가-힣]+)을\(를\)/g,
    (_, word) => postfix(word, "을/를")
  );
  result = result.replace(
    /([가-힣]+)를\(을\)/g,
    (_, word) => postfix(word, "을/를")
  );
  result = result.replace(
    /([가-힣]+)이\(가\)/g,
    (_, word) => postfix(word, "이/가")
  );
  result = result.replace(
    /([가-힣]+)가\(이\)/g,
    (_, word) => postfix(word, "이/가")
  );
  result = result.replace(
    /([가-힣]+)은\(는\)/g,
    (_, word) => postfix(word, "은/는")
  );
  result = result.replace(
    /([가-힣]+)는\(은\)/g,
    (_, word) => postfix(word, "은/는")
  );

  return result;
}

/**
 * 조사 선택 헬퍼 (템플릿 리터럴에서 사용)
 * @example `${name}${josa(name, "은/는")} 잘 지내?`
 */
export function josa(word: string, particle: string): string {
  const pair = PARTICLE_MAP[particle];
  if (!pair) return particle;

  const { has, isRieul } = getJongseong(lastChar(word));

  if (particle === "으로/로" && isRieul) {
    return "로";
  }

  return has ? pair[0] : pair[1];
}
