// Records the NusaFleet demo for the video: scene 4 (the tool) and scene 5
// (Indonesia x Russia). Drives the dashboard in Chrome with a visible cursor
// and saves one 1920x1080 video per scene.
//
// Usage: node record_demo.cjs <output-dir> [scene4|scene5]
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const URL = 'http://localhost:5173';
const SIZE = { width: 1920, height: 1080 };
const outDir = path.resolve(process.argv[2] || '.');
const only = process.argv[3];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A drawn cursor, because screen capture of a driven browser has no pointer
const CURSOR = `
(() => {
  const make = () => {
    if (document.getElementById('__cursor')) return;
    const c = document.createElement('div');
    c.id = '__cursor';
    c.style.cssText = 'position:fixed;left:0;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:rgba(255,255,255,0.92);border:3px solid #06252b;box-shadow:0 2px 10px rgba(0,0,0,0.45);z-index:2147483647;pointer-events:none;transition:transform 0.12s ease, background 0.12s ease;';
    document.documentElement.appendChild(c);
    addEventListener('mousemove', (e) => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; }, true);
    addEventListener('mousedown', () => { c.style.transform = 'scale(0.7)'; c.style.background = '#7fe3d2'; }, true);
    addEventListener('mouseup', () => { c.style.transform = 'scale(1)'; c.style.background = 'rgba(255,255,255,0.92)'; }, true);
  };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', make); else make();
})();`;

let pos = { x: 960, y: 620 };

async function moveTo(page, x, y) {
  const steps = Math.max(18, Math.round(Math.hypot(x - pos.x, y - pos.y) / 14));
  await page.mouse.move(x, y, { steps });
  pos = { x, y };
  await sleep(250);
}

async function clickAt(page, x, y, after = 1200) {
  await moveTo(page, x, y);
  await page.mouse.down();
  await sleep(90);
  await page.mouse.up();
  await sleep(after);
}

async function centre(locator) {
  const box = await locator.first().boundingBox();
  if (!box) throw new Error('element not visible');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function click(page, locator, after = 1200) {
  const c = await centre(locator);
  await clickAt(page, c.x, c.y, after);
}

async function scrollBy(page, total, ms) {
  const steps = Math.max(1, Math.round(ms / 16));
  for (let i = 0; i < steps; i += 1) {
    await page.mouse.wheel(0, total / steps);
    await sleep(16);
  }
  await sleep(300);
}

const pill = (page, year) => page.locator('.map-top [role="radio"]', { hasText: year });
const priority = (page, name) => page.locator('.map-top [role="radio"]', { hasText: new RegExp(`^${name}$`) });
const nav = (page, name) => page.locator('header nav button', { hasText: name });
const tab = (page, name) => page.locator('[role="tab"]', { hasText: name });

async function open(page) {
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('.map .route-line');
  // English for the whole recording
  await page.locator('header button', { hasText: /^EN$/ }).click();
  await sleep(2500);
  await page.mouse.move(pos.x, pos.y);
}

async function scene4(page) {
  await open(page);
  await sleep(5000); // hold on the opening state: 2026, Balanced

  // Play 2026 to 2031
  await click(page, page.locator('.map-top button[aria-label^="Play"]'), 800);
  await moveTo(page, 1650, 300);
  await sleep(9500);

  // Back to 2026, walk the priority
  await click(page, pill(page, '2026'), 1500);
  await click(page, priority(page, 'Cheapest'), 2200);
  await click(page, priority(page, 'Balanced'), 1500);
  await moveTo(page, 1660, 260); // rest on the headline numbers
  await sleep(6000);

  // 2031, Cleanest: charging stations and electric routes appear
  await click(page, pill(page, '2031'), 2000);
  await click(page, priority(page, 'Cleanest'), 1200);
  await moveTo(page, 760, 640);
  await sleep(6500);

  // Click the Ternate to Jailolo route (third route in the data)
  const routePoint = await page.evaluate(() => {
    const el = document.querySelectorAll('.map-stage > .map path.route-line')[2];
    const p = el.getPointAtLength(el.getTotalLength() * 0.55);
    const m = el.getScreenCTM();
    return { x: p.x * m.a + p.y * m.c + m.e, y: p.x * m.b + p.y * m.d + m.f };
  });
  await clickAt(page, routePoint.x, routePoint.y, 1000);
  await moveTo(page, 1700, 520);
  await sleep(5500);
  await click(page, page.locator('.MuiDrawer-paper button[aria-label="Close"]'), 1200);

  // What if: raise the diesel price
  await click(page, tab(page, 'What if'), 1500);
  const thumb = await centre(page.locator('input[aria-label="Diesel price"]').locator('xpath=..'));
  await moveTo(page, thumb.x, thumb.y);
  await page.mouse.down();
  await page.mouse.move(thumb.x + 150, thumb.y, { steps: 45 });
  await sleep(200);
  await page.mouse.up();
  pos = { x: thumb.x + 150, y: thumb.y };
  await sleep(5000);

  // Save it and compare
  await click(page, page.locator('button', { hasText: 'Save alternative' }), 4500);

  // Report
  await click(page, nav(page, 'Report'), 3000);
  await moveTo(page, 960, 600);
  await scrollBy(page, 900, 3500);
  await sleep(2500);
}

async function scene5(page) {
  await open(page);
  await click(page, pill(page, '2031'), 1200);
  await click(page, priority(page, 'Cleanest'), 2500);

  await click(page, nav(page, 'Russia'), 1500);
  await moveTo(page, 960, 430);
  await sleep(5500); // the three columns
  await scrollBy(page, 420, 2500);
  await sleep(4500); // the cooperation so far
  await scrollBy(page, 430, 2500);
  await moveTo(page, 960, 520);
  await sleep(7000); // the new vessels needed
  await scrollBy(page, 420, 2500);
  await sleep(6000); // what we propose
}

async function record(browser, name, scene) {
  const tmp = path.join(outDir, `_${name}`);
  fs.rmSync(tmp, { recursive: true, force: true });
  const context = await browser.newContext({ viewport: SIZE, deviceScaleFactor: 1, recordVideo: { dir: tmp, size: SIZE } });
  await context.addInitScript(CURSOR);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  pos = { x: 960, y: 620 };
  const started = Date.now();
  await scene(page);
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  const video = page.video();
  await context.close();
  const target = path.join(outDir, `${name}.webm`);
  fs.rmSync(target, { force: true });
  fs.renameSync(await video.path(), target);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`${name}: ${seconds}s, page errors: ${errors.length}${errors.length ? ' ' + errors[0] : ''}`);
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--hide-scrollbars'] });
  try {
    if (!only || only === 'scene4') await record(browser, 'demo_scene4', scene4);
    if (!only || only === 'scene5') await record(browser, 'demo_scene5', scene5);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
