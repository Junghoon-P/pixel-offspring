import { test, expect } from "@playwright/test";
test("210조합은 누락 없이 완성 그림을 표시한다", async ({ page }) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.url().includes("/creatures/") && response.status() >= 400) errors.push(response.url());
  });
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto("/gallery/fusions");
  const labels = new Set<string>();
  for (let index = 0; index < 10; index++) {
    await expect(page.getByRole("status")).toHaveText(`${index + 1} / 10`);
    await expect(page.getByRole("img")).toHaveCount(21);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
    const nonempty = await page.locator("canvas").evaluateAll((canvases: HTMLCanvasElement[]) =>
      canvases.every((canvas) => canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data.some((value, i) => i % 4 === 3 && value > 0)));
    expect(nonempty).toBe(true);
    for (const label of await page.locator("figcaption").allTextContents()) labels.add(label);
    await page.screenshot({ path: `test-results/fusions-${index + 1}.png`, fullPage: true });
    if (index < 9) await page.getByRole("button", { name: "다음 조합" }).click();
  }
  expect(labels.size).toBe(210);
  expect(errors).toEqual([]);
  await expect(page.getByRole("button", { name: "다음 조합" })).toBeDisabled();
});
