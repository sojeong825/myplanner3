"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

/**
 * 이메일 인증만 쓰는 로그인. 비밀번호를 만들지 않는다(패스워드리스).
 *
 * 가입과 로그인을 구분하지 않는다 — 처음 인증한 이메일이면 자동 가입,
 * 기존 이메일이면 로그인으로 이어진다.
 */
export function useAuth() {
  /** undefined = 아직 확인 중, null = 게스트 */
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    // 로그인/로그아웃/토큰 갱신을 한 곳에서 받는다.
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  /** 인증 메일 보내기. 계정이 없으면 이 단계에서 만들어진다. */
  const sendCode = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    if (error) throw new Error(error.message);
  }, []);

  /** 메일로 받은 6자리 코드 확인 */
  const verifyCode = useCallback(async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: "email",
    });
    if (error) throw new Error(error.message);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return {
    session,
    /** 세션 확인이 끝났는지 */
    ready: session !== undefined,
    userId: session?.user.id ?? null,
    email: session?.user.email ?? null,
    sendCode,
    verifyCode,
    signOut,
  };
}
