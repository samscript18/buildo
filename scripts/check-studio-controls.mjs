import { expect } from "@playwright/test";
import sharp from "sharp";

export async function checkStudioControls(page, directory) {
  const canvas = page.locator("canvas");
  const numeric = page.locator(".numeric-grid");
  const values = async () =>
    Promise.all(
      [0, 1, 2].map((group) =>
        numeric
          .nth(group)
          .locator("input")
          .evaluateAll((inputs) => inputs.map((i) => Number(i.value))),
      ),
    );
  const evidence = [];
  async function dragRedHandle(mode, group, snap = false) {
    await page.getByRole("button", { name: mode, exact: true }).click();
    await expect(
      page.getByRole("button", { name: mode, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.mouse.move(10, 10);
    await page.waitForTimeout(200);
    const before = await values();
    const box = await canvas.boundingBox();
    const png = await canvas.screenshot();
    const { data, info } = await sharp(png)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const pixels = [];
    for (let y = 90; y < info.height - 60; y++)
      for (let x = 25; x < info.width - 25; x++) {
        const i = (y * info.width + x) * info.channels;
        if (data[i] > 210 && data[i + 1] < 65 && data[i + 2] < 65)
          pixels.push({ x, y });
      }
    expect(pixels.length, `${mode} has a visible red gizmo`).toBeGreaterThan(5);
    pixels.sort((a, b) => a.x - b.x);
    const target = pixels[Math.floor(pixels.length * 0.8)];
    const x = box.x + (target.x * box.width) / info.width;
    const y = box.y + (target.y * box.height) / info.height;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 65, y - 28, { steps: 18 });
    await page.mouse.up();
    await expect
      .poll(async () => (await values())[group])
      .not.toEqual(before[group]);
    const after = await values();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(
      page.getByText("● Unsaved changes", { exact: false }),
    ).toHaveCount(0);
    const id = new URL(page.url()).pathname.split("/").pop();
    const saved = await (
      await page.request.get(new URL(`/api/projects/${id}`, page.url()).href)
    ).json();
    const object = saved.project.scene.objects[0];
    for (let i = 0; i < 3; i++) {
      expect(object.position[i]).toBeCloseTo(after[0][i], 2);
      expect((object.rotation[i] * 180) / Math.PI).toBeCloseTo(after[1][i], 2);
      expect(object.scale[i]).toBeCloseTo(after[2][i], 2);
    }
    if (snap && group === 0)
      for (const value of after[0])
        expect(value / 0.25).toBeCloseTo(Math.round(value / 0.25), 2);
    evidence.push({
      action: `${mode}${snap ? " with snap" : ""}`,
      before,
      after,
      actualPointerDrag: true,
      databaseSaveVerified: true,
    });
    await page.screenshot({
      path: `${directory}/controls-${mode.toLowerCase()}${snap ? "-snap" : ""}.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    expect(await values()).toEqual(before);
    await page.getByRole("button", { name: "Redo", exact: true }).click();
    expect(await values()).toEqual(after);
    await page.getByRole("button", { name: "Undo", exact: true }).click();
  }
  await dragRedHandle("Move", 0);
  await dragRedHandle("Rotate", 1);
  await dragRedHandle("Resize", 2);
  await page.getByRole("button", { name: "Snap", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Snap", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await dragRedHandle("Move", 0, true);
  await page.getByRole("button", { name: "Snap", exact: true }).click();
  await page.getByRole("button", { name: "Reset view", exact: true }).click();
  await page.mouse.move(10, 10);
  await page.waitForTimeout(250);
  const initial = await canvas.screenshot();
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.75);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.65, {
    steps: 15,
  });
  await page.mouse.up();
  await page.waitForTimeout(500);
  expect((await canvas.screenshot()).equals(initial)).toBe(false);
  await page.getByRole("button", { name: "Reset view", exact: true }).click();
  await page.mouse.move(10, 10);
  await page.waitForTimeout(500);
  const reset = await canvas.screenshot();
  const a = await sharp(initial).raw().toBuffer();
  const b = await sharp(reset).raw().toBuffer();
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference += Math.abs(a[i] - b[i]);
  expect(
    difference / a.length,
    "Reset view restores the rendered camera",
  ).toBeLessThan(1);
  evidence.push({
    action: "orbit then Reset view",
    averagePixelDifference: difference / a.length,
  });
  return evidence;
}
