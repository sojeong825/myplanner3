import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 가 없습니다. .env.local 을 확인하세요.",
  );
}

export const supabase = createClient(url, key, {
  auth: {
    // 세션을 브라우저에 남겨 다시 열어도 로그인 상태가 유지되게 한다.
    persistSession: true,
    autoRefreshToken: true,
    // 메일의 매직링크로 돌아왔을 때 URL의 토큰을 세션으로 바꿔준다.
    detectSessionInUrl: true,
  },
});
