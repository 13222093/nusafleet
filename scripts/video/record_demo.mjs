// Records the dashboard demo for scenes 4 and 5 of the video, timed to the narration.
// Frames come from Chrome's screencast (JPEG q92 at 1920x1080), with their real
// timestamps, so ffmpeg can rebuild a constant-rate clip without blur.
//
// Usage (from a folder that has playwright installed):
//   node record_demo.mjs <out_dir> [url]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(path.join(process.cwd(), 'noop.js'));
const { chromium } = require('playwright');

const OUT = path.resolve(process.argv[2] ?? 'demo_frames');
const URL = process.argv[3] ?? 'https://nusafleet.vercel.app';
const W = 1440;
const H = 810;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function record(page, name, run) {
  const dir = path.join(OUT, name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', async (f) => {
    const file = `f${String(frames.length).padStart(5, '0')}.jpg`;
    fs.writeFileSync(path.join(dir, file), Buffer.from(f.data, 'base64'));
    frames.push({ file, t: f.metadata.timestamp });
    try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch {}
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
  const t0 = Date.now();
  await run();
  await cdp.send('Page.stopScreencast');
  await sleep(300);
  // ffconcat list with each frame shown until the next one arrived
  const lines = ['ffconcat version 1.0'];
  frames.forEach((f, i) => {
    const next = frames[i + 1]?.t ?? f.t + 1 / 30;
    lines.push(`file '${f.file}'`, `duration ${Math.max(0.001, next - f.t).toFixed(4)}`);
  });
  lines.push(`file '${frames.at(-1).file}'`);
  fs.writeFileSync(path.join(dir, 'frames.ffconcat'), lines.join('\n'));
  console.log(name, frames.length, 'frames,', ((Date.now() - t0) / 1000).toFixed(1), 's');
}

const browser = await chromium.launch({
  channel: 'chrome',
  headless: false,
  args: [`--window-size=${W},${H + 140}`, '--force-device-scale-factor=1', '--hide-scrollbars'],
});
const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, locale: 'en-GB' });
const page = await context.newPage();

// A soft cursor so viewers can follow the clicks
await page.addInitScript(() => {
  window.addEventListener('DOMContentLoaded', () => {
    const c = document.createElement('div');
    c.id = '__cursor';
    c.style.cssText = 'position:fixed;left:0;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;border:2px solid #0f1417;background:rgba(181,21,122,.18);z-index:99999;pointer-events:none;transition:transform .12s;';
    document.body.appendChild(c);
    window.addEventListener('mousemove', (e) => { c.style.left = `${e.clientX}px`; c.style.top = `${e.clientY}px`; }, true);
    window.addEventListener('mousedown', () => { c.style.transform = 'scale(.7)'; }, true);
    window.addEventListener('mouseup', () => { c.style.transform = 'none'; }, true);
  });
});

async function glide(x, y, steps = 28) {
  await page.mouse.move(x, y, { steps });
}
async function clickEl(locator, pause = 900) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('not visible: ' + locator);
  await glide(box.x + box.width / 2, box.y + box.height / 2);
  await sleep(180);
  await page.mouse.down();
  await page.mouse.up();
  await sleep(pause);
}

// English UI for an English video
await page.goto(URL, { waitUntil: 'load', timeout: 90000 });
await page.getByRole('button', { name: 'EN', exact: true }).click();
await page.waitForSelector('.twin-port', { timeout: 60000 });
await page.waitForFunction(() => !document.querySelector('.twin-loading'), null, { timeout: 60000 });
await sleep(2500);
await page.mouse.move(W - 200, H - 160);

await record(page, 's4', async () => {
  const radio = (re) => page.getByRole('radio', { name: re });
  // 0 to 10 s: the chart at rest, ferries sailing; a slow orbit shows the relief
  await sleep(3500);
  const canvas = page.locator('canvas').first();
  const cb = await canvas.boundingBox();
  await glide(cb.x + cb.width * 0.62, cb.y + cb.height * 0.55, 20);
  await page.mouse.down();
  await page.mouse.move(cb.x + cb.width * 0.5, cb.y + cb.height * 0.5, { steps: 90 });
  await page.mouse.up();
  await sleep(2600);
  await page.getByRole('button', { name: /Reset the view/i }).click();
  await sleep(2200);
  // Power supply: 2027, 2031, back to 2026
  await clickEl(radio(/^2027/), 1500);
  await clickEl(radio(/^2031/), 1700);
  await clickEl(radio(/^2026/), 1500);
  // Priority: cheapest, cleanest, balanced
  await clickEl(radio(/^Cheapest$/), 1400);
  await clickEl(radio(/^Cleanest$/), 1400);
  await clickEl(radio(/^Balanced$/), 2200);
  // The balanced numbers and the fleet table
  // Held until the narration reaches "Move to the cleanest plan in 2031"
  await glide(W - 420, 260, 30);
  await sleep(7400);
  await glide(W - 420, 640, 30);
  await sleep(6800);
  // 2031, cleanest: the chart is corrected, magenta columns rise
  await clickEl(radio(/^2031/), 800);
  await clickEl(radio(/^Cleanest$/), 5200);
  // Click the electric route (its label sits on the line)
  const tag = page.locator('.twin-tag', { hasText: /electric/i }).first();
  const tb = await tag.boundingBox();
  await glide(tb.x + tb.width / 2, tb.y + tb.height / 2 + 6);
  await sleep(250);
  await page.mouse.down();
  await page.mouse.up();
  await sleep(5200);
  await page.getByRole('button', { name: /close/i }).first().click().catch(() => {});
  await sleep(1200);
  await clickEl(page.getByRole('button', { name: /Save alternative/i }), 2000);
  await clickEl(page.getByRole('button', { name: /Create report/i }), 3200);
  await page.mouse.wheel(0, 900);
  await sleep(2600);
});

await record(page, 's5', async () => {
  // In-app link: keeps the 2031 cleanest plan and the English UI
  await clickEl(page.locator('nav a[href="/kerja-sama"]'), 3600);
  const sheet = page.locator('h2', { hasText: /new vessel|requirement/i }).first();
  const top = (await sheet.boundingBox())?.y ?? 1400;
  // Glide down to the requirement sheet, then the proposals
  for (let y = 0; y < top - 120; y += 40) {
    await page.mouse.wheel(0, 40);
    await sleep(28);
  }
  await sleep(9000);
  for (let i = 0; i < 18; i += 1) {
    await page.mouse.wheel(0, 40);
    await sleep(28);
  }
  await sleep(9000);
});

await browser.close();
