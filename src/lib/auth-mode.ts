export function isAuthBypassMode(): boolean {
  const mode = process.env.NEXT_PUBLIC_AUTH_MODE;
  const legacyFlag = process.env.NEXT_PUBLIC_DEV_SKIP_AUTH;
  return mode === "dev-bypass" || legacyFlag === "true";
}

