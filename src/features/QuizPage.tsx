"use client";
import { useSyncExternalStore } from "react";
import type { ReactElement } from "react";
import { useRouter } from "next/navigation";
import { Quiz } from "./Quiz";
const subscribe = (): (() => void) => (): void => undefined;
export const QuizPage = (): ReactElement => {
  const router = useRouter();
  // Restore private browser drafts only after the server HTML has hydrated.
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return hydrated ? (
    <Quiz navigate={(path): void => router.push(path)} />
  ) : (
    <p role="status">질문을 준비하는 중…</p>
  );
};
