import type { Metadata } from "next";
import type { ReactElement, ReactNode } from "react";
import Link from "next/link";
import "../style.css";
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.APP_ORIGIN ?? "https://pixel-offspring.vercel.app",
  ),
  title: "너랑 나 사이에서 태어난",
  description:
    "두 사람의 작은 특징이 만나 태어나는 도트 생물. 가볍게 즐기는 조합 놀이.",
  robots: { index: false, follow: false },
  icons: { icon: [{ url: "/favicon.png", type: "image/png", sizes: "64x64" }] },
  openGraph: {
    title: "너랑 나 사이에서 태어난",
    description: "두 사람의 작은 특징이 만나 태어나는 도트 생물",
    images: ["/og.png"],
  },
};
const RootLayout = ({ children }: { children: ReactNode }): ReactElement => (
  <html lang="ko">
    <body>
      <main>
        <nav aria-label="주 메뉴">
          <Link href="/">도트 생물</Link>
          <Link href="/me">내 생물</Link>
        </nav>
        {children}
        <footer>
          <p className="muted">
            닉네임·생물·유형 설명은 링크를 아는 사람에게 공개돼요. 원본 답변은
            서버에 저장하지 않아요. 관리 권한은 현재 브라우저에만 연결됩니다.
          </p>
          <p className="muted">성격·관계 진단이 아닌 오락 콘텐츠예요.</p>
        </footer>
      </main>
    </body>
  </html>
);
export default RootLayout;
