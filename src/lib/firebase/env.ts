/**
 * Firebase 환경변수 참조용 헬퍼
 *
 * 사용 방법:
 * 1) 루트의 `.env.example`를 참고해서 `.env.local`에 키를 넣습니다.
 * 2) 키를 코드에 직접 하드코딩하지 말고 이 파일을 통해 참조합니다.
 * 3) `FIREBASE_SERVICE_ACCOUNT_JSON`은 서버 전용 값입니다.
 */
export const firebasePublicEnv = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "",
};

export const firebaseServerEnv = {
  serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? "",
};

export function hasFirebaseClientEnv() {
  return Boolean(
    firebasePublicEnv.apiKey &&
      firebasePublicEnv.authDomain &&
      firebasePublicEnv.projectId &&
      firebasePublicEnv.appId
  );
}

