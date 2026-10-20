// @vitest-environment jsdom
import { expect, it } from "vitest";
import { LegendCodex } from "./LegendCodex";
import { setupDom, render, text } from "../../tests/unit/dom";
import { result } from "../../tests/unit/fixtures";
setupDom();
it("동시에 달성한 레전드는 모두 기록하며 대표 외형과 개별 조건을 구분한다", async () => {
  const saved = await result();
  const legend = { version: 1 as const, id: "guardian" as const, name: "티격태격 수호자", reason: "수호자 조건",
    ability: "함께하기", matched: ["guardian", "expedition", "chaos"] as ("guardian" | "expedition" | "chaos")[] };
  await render(<LegendCodex results={[{ ...saved, child: { ...saved.child, legend } }]} hasMore={false} />);
  expect(text()).toContain("레전드 도감 · 3 / 4");
  expect(text()).toContain("무계획 대참사");
  expect(text()).toContain("둘 다 새로운 경험을 좋아하고 즉흥적으로 움직이는 성향이 강했어요.");
  expect(text()).toContain("대표 외형은 티격태격 수호자예요");
});
