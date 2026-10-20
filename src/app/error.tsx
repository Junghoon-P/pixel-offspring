"use client";
import type { ReactElement } from "react";
const ErrorPage = ({ reset }: { reset: () => void }): ReactElement => (
  <>
    <h1>잠시 연결이 어려워요</h1>
    <p role="alert">다시 시도해 주세요.</p>
    <button onClick={reset}>다시 시도</button>
  </>
);
export default ErrorPage;
