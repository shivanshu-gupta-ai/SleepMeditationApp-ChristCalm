/**
 * Export each onboarding phone frame as a 390×844 PNG for Figma import.
 * Usage (from repo root or this folder):
 *   node docs/design/onboarding-figma/export-pngs.mjs
 */
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, "onboarding-artboard.html");
const outDir = path.join(__dirname, "exports");
const fileUrl = "file://" + htmlPath;

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});

const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});

await page.goto(fileUrl, { waitUntil: "networkidle" });

const frames = await page.$$eval(".frame-wrap", (els) =>
  els.map((el) => ({
    name: el.getAttribute("data-name"),
    step: el.getAttribute("data-step"),
  }))
);

for (const f of frames) {
  await page.evaluate((step) => {
    document.body.classList.add("export-mode");
    document.querySelectorAll(".frame-wrap").forEach((el) => {
      el.classList.toggle("export-target", el.getAttribute("data-step") === step);
    });
  }, f.step);

  // Wait layout
  await page.waitForTimeout(80);
  const phone = await page.$(`.export-target .phone`);
  if (!phone) {
    console.error("Missing phone for step", f.step);
    continue;
  }
  const out = path.join(outDir, `${f.name}.png`);
  await phone.screenshot({ path: out, type: "png" });
  console.log("wrote", out);
}

// Full artboard overview (wide)
await page.evaluate(() => {
  document.body.classList.remove("export-mode");
  document.querySelectorAll(".frame-wrap").forEach((el) => el.classList.remove("export-target"));
});
await page.setViewportSize({ width: 2800, height: 2000 });
await page.waitForTimeout(100);
await page.screenshot({
  path: path.join(outDir, "00-full-artboard.png"),
  fullPage: true,
  type: "png",
});
console.log("wrote full artboard");

await browser.close();
console.log("Done →", outDir);
