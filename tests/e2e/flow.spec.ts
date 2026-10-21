import memeFusions from "../../src/domain/memeFusions.json" with { type: "json" };
import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
const quiz = async (page: Page, name: string): Promise<void> => {
  await page.getByRole("link", { name: "내 생물 만들기", exact: true }).click();
  await page.getByLabel("닉네임").fill(name);
  for (let i = 0; i < 10; i++) {
    await page.getByRole("radio").first().check();
    await page
      .getByRole("button", {
        name: i === 9 ? "내 캐릭터 확인하기" : "다음",
        exact: true,
      })
      .click();
  }
  await expect(page.getByRole("heading", { name: "내 생물" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /경계 없는 균형가/ }),
  ).toBeVisible();
};
test("두 브라우저에서 초대·질문·공동 결과·PNG·삭제", async ({ browser }) => {
  const a = await browser.newContext({ viewport: { width: 390, height: 844 } }),
    b = await browser.newContext({
      viewport: { width: 360, height: 800 },
      reducedMotion: "reduce",
    });
  const p = await a.newPage(),
    q = await b.newPage();
  await p.goto("/");
  await quiz(p, "한글🙂");
  await p.getByRole("button", { name: "함께할 사람 초대하기" }).click();
  const invite = await p.getByLabel("초대 링크").inputValue();
  await q.goto(invite);
  await quiz(q, "이불 친구");
  await expect(
    q.getByRole("button", { name: "우리 조합 보기" }),
  ).toBeVisible();
  await q.getByRole("button", { name: "우리 조합 보기" }).click();
  await expect(q).toHaveURL(/\/r\//);
  await expect(
    q.getByRole("heading", { name: "우리 무슨 조합?" }),
  ).toBeVisible();
  const url = q.url();
  await p.reload();
  await expect(p.getByRole("link", { name: /결과 보기/ })).toHaveCount(1);
  await p.getByRole("link", { name: /결과 보기/ }).click();
  await expect(p).toHaveURL(url);
  const download = p.waitForEvent("download");
  await p.getByRole("button", { name: "PNG 저장" }).click();
  const card = await download;
  expect(card.suggestedFilename()).toBe("pixel-offspring.png");
  await card.saveAs("test-results/result-card.png");
  await p.screenshot({
    path: "test-results/result-mobile.png",
    fullPage: true,
  });
  await p.getByRole("link", { name: "내 생물", exact: true }).click();
  p.on("dialog", (dialog) => dialog.accept());
  await p.getByRole("button", { name: "이 생물 삭제" }).click();
  await q.reload();
  await expect(q.getByText(/삭제되었거나|보관 기간/).first()).toBeVisible();
  await a.close();
  await b.close();
});
test("질문 초안 복구·이전·한글 길이 검증", async ({ page }) => {
  await page.goto("/create");
  await page.getByLabel("닉네임").fill("가".repeat(13));
  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
  await page.getByLabel("닉네임").fill("복구");
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await page.reload();
  await expect(page.getByText("같이 밥 먹을 곳을 고른다면?")).toBeVisible();
  await page.getByRole("button", { name: "이전", exact: true }).click();
  await expect(page.getByLabel("닉네임")).toHaveValue("복구");
  await expect(page.getByRole("radio").first()).toBeChecked();
});
test("저장 실패 후 초안을 유지하고 재시도한다", async ({ page }) => {
  await page.goto("/create");
  await page.getByLabel("닉네임").fill("재시도");
  for (let i = 0; i < 9; i++) {
    await page.getByRole("radio").first().check();
    await page.getByRole("button", { name: "다음", exact: true }).click();
  }
  await page.getByRole("radio").first().check();
  await page.route("**/api/characters", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: { code: "UNAVAILABLE", message: "테스트 저장 실패" },
      }),
    }),
  );
  await page.getByRole("button", { name: "내 캐릭터 확인하기" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("테스트 저장 실패");
  await expect(page.getByRole("radio").first()).toBeChecked();
  await page.unroute("**/api/characters");
  await page.getByRole("button", { name: "내 캐릭터 확인하기" }).click();
  await expect(page.getByRole("heading", { name: "내 생물" })).toBeVisible();
});
test("20종·코스튬8쌍·구버전 파츠를 실제 렌더러로 표시하며 누락된 에셋이 없다", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.url().includes("/creatures/") && response.status() >= 400)
      errors.push(response.url());
  });
  await page.setViewportSize({ width: 1100, height: 900 });
  await page.goto("/gallery");
  await expect(page.getByRole("img")).toHaveCount(28);
  await page.getByText("저장된 구버전 그림 비교", { exact: true }).click();
  await expect(page.getByRole("img")).toHaveCount(104);
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
  await page.screenshot({ path: "test-results/gallery.png", fullPage: true });
});
test("개선 그림과 구버전 비교·데모를 표시한다", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("img", { name: memeFusions.find((item) => item.id === "bird-mushroom")!.name, exact: true }),
  ).toBeVisible();
  await page
    .locator("section.panel")
    .screenshot({ path: "test-results/character-costume-demo.png" });
  await page.goto("/gallery");
  await page.waitForLoadState("networkidle");
  await page.getByText("저장된 구버전 그림 비교", { exact: true }).click();
  const updated = await page
    .locator("details canvas")
    .first()
    .evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  await page.getByLabel("그림 버전").selectOption("1");
  await page.waitForLoadState("networkidle");
  await expect
    .poll(() =>
      page
        .locator("details canvas")
        .first()
        .evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()),
    )
    .not.toBe(updated);
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
  await page.getByLabel("그림 버전").selectOption("3");
  await expect
    .poll(() =>
      page
        .locator("details canvas")
        .first()
        .evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()),
    )
    .toBe(updated);
});
test("전체84개 허용 파츠 조합 검수판을 렌더링한다", async ({ page }) => {
  await page.setViewportSize({ width: 1240, height: 1000 });
  await page.goto("/docs/character-audit.html");
  await expect(page.locator('canvas[data-ready="true"]')).toHaveCount(84);
  await expect(page.locator("canvas")).toHaveCount(84);
  await expect(page.locator('canvas[data-asset-version="3"]')).toHaveCount(84);
  await page.screenshot({
    path: "test-results/character-audit-v3.png",
    fullPage: true,
  });
});
test("구6문항 초안을 새10문항 답변과 섞지 않는다", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() =>
    sessionStorage.setItem(
      "quiz-draft",
      JSON.stringify({
        nickname: "이전친구",
        choices: { q1: "b", q2: "b" },
        step: 4,
        key: crypto.randomUUID(),
      }),
    ),
  );
  await page.goto("/create");
  await expect(page.getByRole("status")).toContainText("10문항");
  await expect(page.getByLabel("닉네임")).toHaveValue("이전친구");
  await expect(page.getByRole("progressbar")).toHaveAttribute("value", "1");
  await expect(page.getByRole("radio").first()).not.toBeChecked();
  await expect(page.getByRole("radio").last()).not.toBeChecked();
});

test("저장소를 차단한 친구도 설문 후 원래 초대로 돌아와 조합한다", async ({
  browser,
}) => {
  const a = await browser.newContext(),
    b = await browser.newContext();
  try {
    await b.addInitScript(() =>
      Object.defineProperty(window, "sessionStorage", {
        get: () => {
          throw new DOMException("Blocked", "SecurityError");
        },
      }),
    );
    const p = await a.newPage(),
      q = await b.newPage();
    const errors: string[] = [];
    q.on("pageerror", (error) => errors.push(error.message));
    await p.goto("/");
    await quiz(p, "초대주인");
    await p.getByRole("button", { name: "함께할 사람 초대하기" }).click();
    await q.goto(await p.getByLabel("초대 링크").inputValue());
    await quiz(q, "저장차단친구");
    await q.getByRole("button", { name: "우리 조합 보기" }).click();
    await expect(q).toHaveURL(/\/r\//);
    await expect(q.getByRole("button", { name: "PNG 저장" })).toBeEnabled();
    await q.reload();
    await expect(
      q.getByRole("heading", { name: "우리 무슨 조합?" }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    await Promise.all([a.close(), b.close()]);
  }
});

test("Next 서버 렌더링·링크 이동·뒤로가기·404", async ({ page, request }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const html = await request.get("/");
  expect(await html.text()).toContain("내 생물 만들기");
  await page.goto("/");
  await page.getByRole("link", { name: "내 생물 만들기", exact: true }).click();
  await expect(page).toHaveURL(/\/create$/);
  await expect(page.getByLabel("닉네임")).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  const missing = await page.goto("/missing-next-page");
  expect(missing?.status()).toBe(404);
  await expect(page.getByRole("link", { name: "처음으로" })).toBeVisible();
  expect(errors).toEqual([]);
});
