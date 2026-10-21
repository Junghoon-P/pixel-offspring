import type { Metadata } from "next";
import type { ReactElement, ReactNode } from "react";
import Link from "next/link";
import "../style.css";
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.APP_ORIGIN ?? "https://pixel-offspring.vercel.app",
  ),
  title: "우리 무슨 조합?",
  description:
    "우리 사이를 캐릭터로 그려보면? 각자 열 가지 질문에 답하면 둘만의 조합이 나와요.",
  robots: { index: false, follow: false },
  icons: { icon: [{ url: "/favicon.png", type: "image/png", sizes: "64x64" }] },
  openGraph: {
    title: "우리 무슨 조합?",
    description: "우리 사이를 캐릭터로 그려보면? 각자 열 가지 질문에 답하면 둘만의 조합이 나와요.",
    images: ["/og-combination.png"],
  },
};
const RootLayout = ({ children }: { children: ReactNode }): ReactElement => (
  <html lang="ko">
    <body>
      <main>
        <nav aria-label="주 메뉴">
          <Link href="/">우리 무슨 조합?</Link>
          <Link href="/me">내 생물</Link>
        </nav>
        {children}
        <footer>
          <p className="muted">
            닉네임·생물·선택 답변·풀이가 저장되며 초대·결과 링크를 아는 사람에게 공개돼요.
            생물 관리는 지금 쓰는 브라우저에서만 할 수 있어요.
          </p>
          <p className="muted">성격·관계 진단이 아닌 오락 콘텐츠예요.</p>
        </footer>
      </main>
    </body>
  </html>
);
export default RootLayout;
