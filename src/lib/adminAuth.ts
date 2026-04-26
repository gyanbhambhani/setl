import { cookies } from "next/headers";

export const ADMIN_COOKIE = "setl_admin";

function getExpectedPassword(): string | null {
  return process.env.ADMIN_PASSWORD ?? null;
}

export function checkPassword(submitted: string): boolean {
  const expected = getExpectedPassword();
  if (!expected) return false;
  if (submitted.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= submitted.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function isAdmin(): Promise<boolean> {
  const expected = getExpectedPassword();
  if (!expected) return false;
  const jar = await cookies();
  const value = jar.get(ADMIN_COOKIE)?.value;
  return Boolean(value) && value === expected;
}
