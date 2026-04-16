import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FamilyCal",
  description: "가족 캘린더"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="app-root">{children}</div>
        <div className="orientation-lock">
          <div className="orientation-lock-card">
            <div className="orientation-lock-title">세로 모드에서 이용해주세요</div>
            <div className="orientation-lock-text">모바일 가로 모드는 지원하지 않습니다.</div>
          </div>
        </div>
      </body>
    </html>
  );
}
