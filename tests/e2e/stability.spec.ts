import { test, expect } from "@playwright/test";

test("불완전 초안은 처음 빠진 질문으로 복구한다", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() =>
    sessionStorage.setItem(
      "quiz-draft",
      JSON.stringify({
        quizVersion: 2,
        nickname: "복구",
        choices: { q1: "a", q12: "b" },
        step: 11,
        key: crypto.randomUUID(),
      }),
    ),
  );
  await page.goto("/create");
  await expect(page.getByRole("progressbar")).toHaveAttribute("value", "2");
  await expect(page.getByRole("group")).toBeVisible();
});

test("손상 JSON과 저장소 차단에서도 설문을 진행한다", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => sessionStorage.setItem("quiz-draft", "{broken"));
  await page.goto("/create");
  await expect(page.getByRole("progressbar")).toHaveAttribute("value", "1");
  await page.addInitScript(() => {
    Object.defineProperty(window, "sessionStorage", {
      get: () => {
        throw new DOMException("Blocked", "SecurityError");
      },
    });
  });
  await page.reload();
  await page.getByLabel("닉네임").fill("저장차단");
  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute("value", "2");
});

test("저장소 차단에서도 초대와 결과 오류 화면이 중단되지 않는다", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, "sessionStorage", {
      get: () => {
        throw new DOMException("Blocked", "SecurityError");
      },
    });
  });
  await page.goto(`/i/${crypto.randomUUID()}`);
  await expect(
    page.getByRole("heading", { name: "초대를 확인해 주세요" }),
  ).toBeVisible();
  await page.goto(`/r/${crypto.randomUUID()}`);
  await expect(
    page.getByRole("heading", { name: "결과를 볼 수 없어요" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("키보드로 다음 질문에 도달하고 포커스가 질문에 이동한다", async ({
  page,
}) => {
  await page.goto("/create");
  await page.getByLabel("닉네임").fill("키보드");
  await page.getByRole("radio").first().focus();
  await page.keyboard.press("Space");
  await page.getByRole("button", { name: "다음", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("group")).toBeFocused();
});

const resultFixture = async () => {
  const { createSurveyProfile } = await import("../../src/domain/survey");
  const { offspring } = await import("../../src/domain/engine");
  const profile = createSurveyProfile(
    Array.from({ length: 12 }, (_, i) => ({
      questionId: `q${i + 1}`,
      optionId: "a",
    })),
  );
  const parents = [0, 1].map(() => ({
    ...profile,
    id: crypto.randomUUID(),
    nickname: "가나다라마바사아자차카👨‍👩‍👧‍👦",
    assetVersion: 3 as const,
  }));
  return {
    resultId: crypto.randomUUID(),
    parents: parents.map(({ traits: _, ...parent }) => parent),
    child: await offspring(parents[0], parents[1]),
    createdAt: Date.now(),
    expiresAt: Date.now() + 86400000,
  };
};

test("웹폰트 준비가 끝나지 않아도 시스템 폰트 PNG를 저장한다", async ({
  page,
}) => {
  const result = await resultFixture();
  await page.addInitScript(() =>
    Object.defineProperty(document.fonts, "ready", {
      get: () => new Promise(() => undefined),
    }),
  );
  await page.route(`**/api/results/${result.resultId}`, (route) =>
    route.fulfill({ json: { data: result } }),
  );
  await page.goto(`/r/${result.resultId}`);
  await expect(page.getByRole("button", { name: "PNG 저장" })).toBeEnabled();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "PNG 저장" }).click();
  await (await download).saveAs("test-results/stability-long-name.png");
});

test("이미지 로딩 실패 후 카드 재시도와 저장소 차단 결과 조회가 동작한다", async ({
  page,
}) => {
  const result = await resultFixture();
  await page.addInitScript(() =>
    Object.defineProperty(window, "sessionStorage", {
      get: () => {
        throw new DOMException("Blocked", "SecurityError");
      },
    }),
  );
  await page.route(`**/api/results/${result.resultId}`, (route) =>
    route.fulfill({ json: { data: result } }),
  );
  await page.route("**/creatures/**", (route) => route.abort());
  await page.goto(`/r/${result.resultId}`);
  await expect(
    page.getByRole("button", { name: "카드 다시 준비" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "링크 복사" })).toBeEnabled();
  await page.unroute("**/creatures/**");
  await page.getByRole("button", { name: "카드 다시 준비" }).click();
  await expect(page.getByRole("button", { name: "PNG 저장" })).toBeEnabled();
});

test("동작 줄이기 설정은 탄생 연출을 생략한다", async ({ page }) => {
  const result = await resultFixture();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(
    (id) => sessionStorage.setItem("birth-result", id),
    result.resultId,
  );
  await page.route(`**/api/results/${result.resultId}`, (route) =>
    route.fulfill({ json: { data: result } }),
  );
  await page.goto(`/r/${result.resultId}`);
  await expect(page.getByRole("button", { name: "PNG 저장" })).toBeEnabled();
  await expect(page.getByText("새 생물이 눈을 뜨고 있어요…")).toHaveCount(0);
});

test("닉네임이 손상된 초안은 닉네임 입력부터 복구한다", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() =>
    sessionStorage.setItem(
      "quiz-draft",
      JSON.stringify({
        quizVersion: 2,
        nickname: "",
        choices: Object.fromEntries(
          Array.from({ length: 12 }, (_, i) => [`q${i + 1}`, "a"]),
        ),
        step: 11,
        key: crypto.randomUUID(),
      }),
    ),
  );
  await page.goto("/create");
  await expect(page.getByLabel("닉네임")).toBeVisible();
});
