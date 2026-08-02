"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export const PASSWORD_MIN = 6;

/** 가입은 됐지만 이메일 확인이 남아 로그인되지 않은 상태 */
export class NeedsEmailConfirm extends Error {
  constructor() {
    super("가입은 됐어요. 메일로 보낸 링크를 눌러 확인해주세요.");
  }
}

/** 이메일 + 비밀번호 로그인. */
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

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw new Error(error.message);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) throw new Error(error.message);

    // 프로젝트에서 이메일 확인을 켜뒀으면 세션 없이 사용자만 만들어진다.
    if (!data.session) throw new NeedsEmailConfirm();
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
    signIn,
    signUp,
    signOut,
  };
}
