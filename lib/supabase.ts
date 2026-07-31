import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 가 없습니다. .env.local 을 확인하세요.",
  );
}

// 로그인이 스코프 밖이라 세션을 유지할 필요가 없다.
export const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
