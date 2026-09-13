import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

/**
 * lib/의 순수 로직만 테스트한다. 화면은 직접 띄워 확인한다.
 *
 * 여기 담긴 것들(아이콘 자동 매칭, 필터, D-day 라벨, coerceTask)은 눈으로 훑어서는
 * 틀린 걸 알아채기 어렵고, 틀려도 화면이 깨지지 않고 조용히 잘못된 값을 보여준다.
 */
export default defineConfig({
  resolve: {
    // tsconfig의 "@/*" 경로를 vitest에도 그대로 알려준다.
    alias: { "@": resolve(__dirname, ".") },
  },
  test: {
    include: ["lib/**/*.test.ts"],
    environment: "node",
  },
});
