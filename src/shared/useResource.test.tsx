// @vitest-environment jsdom
import { act } from "react";
import { it, expect, vi } from "vitest";
import type { ReactElement } from "react";
import { useResource } from "./useResource";
import { setupDom, render, click, button, text } from "../../tests/unit/dom";
setupDom();
const View = ({
  loader,
  id,
}: {
  loader: () => Promise<string>;
  id: string;
}): ReactElement => {
  const resource = useResource(loader, id);
  return (
    <>
      <p>{resource.loading ? "loading" : resource.error || resource.data}</p>
      <button onClick={resource.reload}>reload</button>
    </>
  );
};
it("늦게 도착한 이전 요청이 새 결과를 덮어쓰지 않는다", async () => {
  let resolveOld: (value: string) => void = () => undefined;
  await render(
    <View
      id="old"
      loader={() =>
        new Promise((resolve) => {
          resolveOld = resolve;
        })
      }
    />,
  );
  expect(text()).toContain("loading");
  await render(<View id="new" loader={async () => "새 결과"} />);
  await act(async () => resolveOld("이전 결과"));
  expect(text()).toContain("새 결과");
  expect(text()).not.toContain("이전 결과");
});
it("조회 실패 후 최신 loader로 다시 읽고 언마운트 후 응답을 무시한다", async () => {
  const loader = vi.fn(async () => {
    throw "offline";
  });
  await render(<View id="same" loader={loader} />);
  expect(text()).toContain("연결에 실패했어요");
  await render(<View id="same" loader={async () => "복구"} />);
  await click(button("reload"));
  expect(text()).toContain("복구");
  let rejectOld: (error: Error) => void = () => undefined;
  await render(
    <View
      id="pending"
      loader={() =>
        new Promise((_, reject) => {
          rejectOld = reject;
        })
      }
    />,
  );
  await render(<p>다른 화면</p>);
  await act(async () => rejectOld(new Error("late")));
  expect(text()).toBe("다른 화면");
});
