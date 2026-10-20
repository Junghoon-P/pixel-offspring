import Link from "next/link";
import type { ReactElement } from "react";
const NotFound = (): ReactElement => (
  <>
    <h1>페이지를 찾을 수 없어요</h1>
    <Link href="/">처음으로</Link>
  </>
);
export default NotFound;
