import { afterEach, expect, it, vi } from "vitest";
import {
  readSessionValue,
  removeSessionValue,
  writeSessionValue,
} from "./sessionStorage";
afterEach(() => vi.unstubAllGlobals());
it("저장소 접근이 제한돼도 보조 상태가 화면을 중단하지 않는다", () => {
  const blocked = (): never => {
    throw new DOMException("blocked", "SecurityError");
  };
  vi.stubGlobal("sessionStorage", {
    getItem: blocked,
    setItem: blocked,
    removeItem: blocked,
  });
  expect(readSessionValue("birth-result")).toBeNull();
  expect(() => writeSessionValue("birth-result", "id")).not.toThrow();
  expect(() => removeSessionValue("birth-result")).not.toThrow();
});
it("저장된 보조 상태를 읽고 삭제한다", () => {
  const entries = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string): string | null => entries.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      entries.set(key, value);
    },
    removeItem: (key: string): void => {
      entries.delete(key);
    },
  });
  writeSessionValue("birth-result", "id");
  expect(readSessionValue("birth-result")).toBe("id");
  removeSessionValue("birth-result");
  expect(readSessionValue("birth-result")).toBeNull();
});
