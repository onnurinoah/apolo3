export function getAdminEmailsFromEnv() {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  return getAdminEmailsFromEnv().includes(email.trim().toLowerCase());
}

export async function isAdminUser(
  supabase: {
    from: (table: string) => {
      select: (columns: string) => {
        ilike: (column: string, value: string) => {
          maybeSingle: () => PromiseLike<{ data: unknown; error: unknown }>;
        };
      };
    };
  },
  email?: string | null
) {
  if (!email) return false;
  if (isAdminEmail(email)) return true;

  const { data, error } = await supabase
    .from("admin_emails")
    .select("email")
    .ilike("email", email.trim())
    .maybeSingle();

  return !error && Boolean(data);
}
