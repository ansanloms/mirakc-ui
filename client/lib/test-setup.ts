import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// 各テスト後に React のマウントツリーを破棄する。happy-dom 環境は
// vitest.config.ts の test.environment で供給されるため、ここでの登録は不要。
afterEach(() => {
  cleanup();
});
