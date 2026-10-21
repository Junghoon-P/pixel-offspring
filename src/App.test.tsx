// @vitest-environment jsdom
import { expect, it, vi } from "vitest";
const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
import { Home } from "./components/Home";
import { Gallery } from "./components/Gallery";
import { QuizPage } from "./features/QuizPage";
import { InvitePage } from "./features/InvitePage";
import {
  setupDom,
  render,
  click,
  button,
  text,
  select,
  flush,
} from "../tests/unit/dom";
import { failure } from "../tests/unit/fixtures";
setupDom();
it("홈 데모와 검수 페이지의 기존 캐릭터 동작을 유지한다", async () => {
  await render(<Home />);
  await flush();
  expect(text()).toContain("우리가 캐릭터라면?");
  await select('select[aria-label="1번 캐릭터"]', "ghost");
  await select('select[aria-label="2번 캐릭터"]', "snail");
  await render(<Gallery />);
  await flush();
  expect(document.querySelectorAll("canvas")).toHaveLength(104);
  for (const version of ["1", "2", "3"]) await select("select", version);
});
it("설문과 초대 페이지가 Next 라우터를 사용한다", async () => {
  await render(<QuizPage />);
  expect(text()).toContain("먼저, 나는 어떤 쪽?");
  await click(button("이전"));
  expect(navigation.push).toHaveBeenCalledWith("/");
  vi.stubGlobal("fetch", async () => failure("찾을 수 없어요", 404));
  await render(<InvitePage id={crypto.randomUUID()} />);
  expect(text()).toContain("초대를 확인해 주세요");
});
