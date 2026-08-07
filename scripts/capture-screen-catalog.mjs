#!/usr/bin/env node
/**
 * Capture every ChristCalm product screen from the local Expo web preview
 * and write PNGs + a multi-page PDF.
 *
 * Prerequisites:
 *   ./scripts/preview.sh   # http://localhost:8081
 *   npx playwright install chromium
 *
 * Usage:
 *   node scripts/capture-screen-catalog.mjs
 *   BASE_URL=http://localhost:8081 node scripts/capture-screen-catalog.mjs
 */

import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
// Prefer local .tools install (not a project dependency) then root/node_modules
const require = createRequire(import.meta.url);
function loadPlaywright() {
  const candidates = [
    path.join(ROOT, ".tools/node_modules/playwright"),
    path.join(ROOT, "node_modules/playwright"),
    "playwright",
  ];
  for (const c of candidates) {
    try {
      return require(c);
    } catch {
      /* try next */
    }
  }
  throw new Error(
    "playwright not found. Run: cd .tools && npm init -y && npm i playwright && npx playwright install chromium"
  );
}
const { chromium } = loadPlaywright();
const OUT_DIR = path.join(ROOT, "docs/screenshots/screen-catalog");
const BASE_URL = process.env.BASE_URL || "http://localhost:8081";
const EMAIL = process.env.CHRISTCALM_TEST_EMAIL || "test@christcalm.dev";
const PASSWORD = process.env.CHRISTCALM_TEST_PASSWORD || "Test1234";

const VIEWPORT = { width: 390, height: 844 };
const DEVICE_SCALE = 2;

const ONBOARDING_STEPS = [
  { id: "splash", auto: true },
  { id: "welcome" },
  { id: "benefit1" },
  { id: "benefit2" },
  { id: "benefit3" },
  { id: "name", fillName: true },
  { id: "heart", pick: '[data-testid="emotion-anxious"]' },
  { id: "faith", pick: '[data-testid="faith-option-seeking"]' },
  { id: "concerns", pick: '[data-testid="concern-anxiety"]' },
  { id: "timing", pick: '[data-testid="time-morning"]' },
  { id: "support", pick: '[data-testid="support-guided_meditations"]' },
  { id: "didYouKnow" },
  { id: "age", pick: '[data-testid="age-25_34"]' },
  { id: "intensity" },
  { id: "calculating", auto: true },
  { id: "profileReveal" },
  { id: "lifetimeLoss" },
  { id: "visualRemaining" },
  { id: "visualLost" },
  { id: "yearsReclaim" },
  { id: "socialProof" },
  { id: "commitment", hold: true },
  { id: "statsPreview" },
  { id: "paywallFull", paywall: "full" },
  { id: "paywall50", paywall: "fifty" },
  { id: "paywall80", paywall: "eighty" },
  { id: "howAppWorks", finish: true },
];

const AUTH_ROUTES = [
  { name: "auth-sign-in", path: "/sign-in" },
  { name: "auth-sign-up", path: "/sign-in?mode=signup" },
  { name: "auth-forgot-password", path: "/forgot-password" },
  { name: "auth-reset-password", path: "/reset-password" },
  { name: "auth-confirm-email", path: "/confirm-email" },
];

const APP_ROUTES = [
  { name: "home", path: "/home" },
  { name: "meditate", path: "/meditate" },
  { name: "prayers", path: "/prayers" },
  { name: "journal", path: "/journal" },
  { name: "wisdom", path: "/wisdom" },
  { name: "stats", path: "/stats" },
  { name: "profile", path: "/profile" },
  { name: "sos", path: "/sos" },
  { name: "paywall", path: "/paywall" },
];

let shotIndex = 0;
const captured = [];

function log(...args) {
  console.log("[capture]", ...args);
}

function ensureOutDir() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (f.endsWith(".png") || f.endsWith(".pdf") || f.endsWith(".json")) {
      fs.unlinkSync(path.join(OUT_DIR, f));
    }
  }
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function clearAppStorage(page) {
  await page.evaluate(async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
    try {
      if (indexedDB.databases) {
        const dbs = await indexedDB.databases();
        await Promise.all(
          (dbs || []).map(
            (db) =>
              new Promise((resolve) => {
                if (!db?.name) return resolve();
                const req = indexedDB.deleteDatabase(db.name);
                req.onsuccess = req.onerror = req.onblocked = () => resolve();
              })
          )
        );
      }
    } catch {
      /* ignore */
    }
  });
}

async function setOnboardingDone(page) {
  await page.evaluate(() => {
    // AsyncStorage web often mirrors into localStorage with JSON values
    localStorage.setItem("cc_onboarding_done", JSON.stringify(true));
  });
}

async function waitSettled(page, ms = 700) {
  try {
    await page.waitForLoadState("networkidle", { timeout: 8000 });
  } catch {
    /* Expo keeps a websocket; ignore */
  }
  await sleep(ms);
}

function shotPath(section, name) {
  shotIndex += 1;
  const file = `${String(shotIndex).padStart(2, "0")}-${section}-${name}.png`;
  return path.join(OUT_DIR, file);
}

async function screenshot(page, section, name, { fullPage = false } = {}) {
  await waitSettled(page, 500);
  const file = shotPath(section, name);
  await page.screenshot({
    path: file,
    fullPage,
    animations: "disabled",
  });
  captured.push({ section, name, file: path.basename(file) });
  log(`saved ${path.basename(file)}`);
  return file;
}

async function clickIfVisible(page, selector, timeout = 4000) {
  const el = page.locator(selector).first();
  try {
    await el.waitFor({ state: "visible", timeout });
    await el.click({ timeout });
    return true;
  } catch {
    return false;
  }
}

async function clickByRoleOrText(page, nameOrText) {
  const byRole = page.getByRole("button", { name: nameOrText, exact: false });
  if ((await byRole.count()) > 0) {
    await byRole.first().click();
    return true;
  }
  const byText = page.getByText(nameOrText, { exact: false });
  if ((await byText.count()) > 0) {
    await byText.first().click();
    return true;
  }
  return false;
}

async function gotoRoute(page, routePath) {
  const url = `${BASE_URL}${routePath.startsWith("/") ? routePath : `/${routePath}`}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await waitSettled(page, 900);
}

async function captureOnboarding(page) {
  log("phase: onboarding");
  await gotoRoute(page, "/");
  await clearAppStorage(page);
  await gotoRoute(page, "/onboarding");

  for (const step of ONBOARDING_STEPS) {
    const testId = `onboarding-screen-${step.id}`;
    try {
      await page.locator(`[data-testid="${testId}"]`).first().waitFor({
        state: "visible",
        timeout: step.auto ? 8000 : 12000,
      });
    } catch {
      log(`warn: missing ${testId} — capturing current viewport`);
    }

    await screenshot(page, "onboarding", step.id);

    if (step.auto) {
      // splash ~1.6s, calculating ~4.2s — wait for next screen
      if (step.id === "splash") {
        await page
          .locator('[data-testid="onboarding-screen-welcome"]')
          .first()
          .waitFor({ state: "visible", timeout: 8000 });
      } else if (step.id === "calculating") {
        await page
          .locator('[data-testid="onboarding-screen-profileReveal"]')
          .first()
          .waitFor({ state: "visible", timeout: 10000 });
      }
      continue;
    }

    if (step.fillName) {
      const input = page.locator('[data-testid="onboarding-name-input"]').first();
      await input.waitFor({ state: "visible", timeout: 5000 });
      await input.fill("Alex");
      await sleep(200);
    }

    if (step.pick) {
      await clickIfVisible(page, step.pick, 5000);
      await sleep(250);
    }

    if (step.hold) {
      const hold = page.locator('[data-testid="onboarding-commit-hold"]').first();
      await hold.waitFor({ state: "visible", timeout: 5000 });
      const box = await hold.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await sleep(1800);
        await page.mouse.up();
      } else {
        await hold.dispatchEvent("pointerdown");
        await sleep(1800);
        await hold.dispatchEvent("pointerup");
      }
      await sleep(400);
    }

    if (step.paywall) {
      const secondary = `[data-testid="paywall-secondary-${step.paywall}"]`;
      const ok = await clickIfVisible(page, secondary, 5000);
      if (!ok) {
        await clickByRoleOrText(page, "Maybe later");
        await clickByRoleOrText(page, "Not now");
        await clickByRoleOrText(page, "Continue");
      }
      await sleep(700);
      continue;
    }

    if (step.finish) {
      await clickIfVisible(page, '[data-testid="onboarding-next-btn"]', 5000);
      await sleep(800);
      continue;
    }

    // Default: primary CTA
    const next = page.locator('[data-testid="onboarding-next-btn"]').first();
    try {
      await next.waitFor({ state: "visible", timeout: 5000 });
      // RN web may keep disabled attribute; force click if needed after selection
      if (await next.isDisabled()) {
        await sleep(300);
      }
      await next.click({ force: true, timeout: 5000 });
    } catch {
      await clickByRoleOrText(page, "Continue");
      await clickByRoleOrText(page, "Begin My Journey");
      await clickByRoleOrText(page, "Next");
      await clickByRoleOrText(page, "This feels true");
      await clickByRoleOrText(page, "I want those years back");
      await clickByRoleOrText(page, "Personalize My Journey");
    }
    await sleep(700);
  }
}

async function captureAuth(page) {
  log("phase: auth");
  await gotoRoute(page, "/");
  await setOnboardingDone(page);
  // Clear tokens so we stay on auth screens
  await page.evaluate(() => {
    for (const k of Object.keys(localStorage)) {
      if (/token|cognito|cc_/i.test(k) && k !== "cc_onboarding_done") {
        localStorage.removeItem(k);
      }
    }
  });

  for (const route of AUTH_ROUTES) {
    await gotoRoute(page, route.path);
    // If redirected away, try alternate expo path
    if (!page.url().includes(route.path.split("?")[0].replace(/^\//, ""))) {
      const alt = route.path
        .replace("/sign-in", "/(auth)/sign-in")
        .replace("/forgot-password", "/(auth)/forgot-password")
        .replace("/reset-password", "/(auth)/reset-password")
        .replace("/confirm-email", "/(auth)/confirm-email");
      await gotoRoute(page, alt);
    }
    await screenshot(page, "auth", route.name);
  }
}

async function signIn(page) {
  log("signing in as", EMAIL);
  await gotoRoute(page, "/sign-in");
  await setOnboardingDone(page);
  await gotoRoute(page, "/sign-in");

  const email = page.locator('[data-testid="auth-email-input"]').first();
  const password = page.locator('[data-testid="auth-password-input"]').first();
  const submit = page.locator('[data-testid="auth-submit-btn"]').first();

  await email.waitFor({ state: "visible", timeout: 15000 });
  await email.fill(EMAIL);
  await password.fill(PASSWORD);
  await submit.click();

  // Wait for home or any tab
  try {
    await page
      .locator('[data-testid="home-greeting"], [data-testid="stats-screen"]')
      .first()
      .waitFor({ state: "visible", timeout: 25000 });
  } catch {
    // fallback: URL contains home
    await page.waitForURL(/home|tabs/, { timeout: 15000 }).catch(() => {});
  }
  await waitSettled(page, 1200);
}

async function captureApp(page) {
  log("phase: main app");
  await signIn(page);

  for (const route of APP_ROUTES) {
    await gotoRoute(page, route.path);
    if (page.url().includes("sign-in") || page.url().includes("onboarding")) {
      log(`warn: redirected away from ${route.path}, re-signing in`);
      await signIn(page);
      await gotoRoute(page, route.path);
    }
    await screenshot(page, "app", route.name, {
      fullPage: route.name === "paywall" || route.name === "meditate",
    });
  }

  // Meditation player — first card on meditate
  log("phase: meditation player");
  await gotoRoute(page, "/meditate");
  const card = page.locator('[data-testid^="meditation-card-"]').first();
  try {
    await card.waitFor({ state: "visible", timeout: 15000 });
    await card.click();
    await waitSettled(page, 1500);
    await screenshot(page, "app", "meditation-player");
  } catch {
    log("warn: no meditation card found — skipping player");
  }
}

function buildPdf() {
  log("building PDF");
  const py = path.join(ROOT, "backend/.venv/bin/python");
  const script = `
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

out_dir = Path(${JSON.stringify(OUT_DIR)})
pngs = sorted(out_dir.glob("*.png"))
if not pngs:
    raise SystemExit("No PNGs found")

pages = []
for p in pngs:
    im = Image.open(p).convert("RGB")
    # Label strip at top
    label = p.stem
    bar_h = 36
    canvas = Image.new("RGB", (im.width, im.height + bar_h), (28, 28, 32))
    draw = ImageDraw.Draw(canvas)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 18)
    except Exception:
        font = ImageFont.load_default()
    draw.text((16, 8), label, fill=(240, 240, 245), font=font)
    canvas.paste(im, (0, bar_h))
    pages.append(canvas)

pdf_path = out_dir / "christcalm-screen-catalog.pdf"
pages[0].save(
    pdf_path,
    save_all=True,
    append_images=pages[1:],
    resolution=144.0,
    quality=90,
)
print(str(pdf_path))
print(f"pages={len(pages)}")
`;
  const result = spawnSync(py, ["-c", script], {
    encoding: "utf8",
    cwd: ROOT,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    throw new Error(`PDF build failed with code ${result.status}`);
  }
}

async function main() {
  ensureOutDir();
  log("base URL:", BASE_URL);
  log("output:", OUT_DIR);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  try {
    await captureOnboarding(page);
  } catch (e) {
    log("onboarding phase error:", e?.message || e);
  }

  try {
    await captureAuth(page);
  } catch (e) {
    log("auth phase error:", e?.message || e);
  }

  try {
    await captureApp(page);
  } catch (e) {
    log("app phase error:", e?.message || e);
  }

  await browser.close();

  fs.writeFileSync(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify({ baseUrl: BASE_URL, captured, count: captured.length }, null, 2)
  );

  if (captured.length === 0) {
    throw new Error("No screenshots captured");
  }

  buildPdf();
  log(`done — ${captured.length} screens → ${path.join(OUT_DIR, "christcalm-screen-catalog.pdf")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
