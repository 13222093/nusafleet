// Renders the motion scenes of scenes.html frame by frame (30 fps, 1920x1080)
// in step with the narration timings, so text appears on the spoken sentence.
//
// Usage (from a folder that has playwright installed):
//   node render_scenes.mjs <scene_dir> <vo_dir> <out_dir> [scene ...]
// <scene_dir> holds scenes.html, chart.jpg and the Archivo fonts.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(path.join(process.cwd(), 'noop.js'));
const { chromium } = require('playwright');

const [sceneDir, voDir, outDir, ...only] = process.argv.slice(2);
const FPS = 30;
const PRE = 0.3; // silence before the voice starts in every scene clip
const POST = 0.6;
const narration = JSON.parse(fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), 'narration.json'), 'utf8'));
const durations = JSON.parse(fs.readFileSync(path.join(voDir, 'durations.json'), 'utf8'));
const timings = JSON.parse(fs.readFileSync(path.join(voDir, 'timings.json'), 'utf8'));

const plan = [
  ['s1_hook', durations.s1_hook + PRE + POST],
  ['s2_intro', durations.s2_intro + PRE + POST],
  ['s3_challenge', durations.s3_challenge + PRE + POST + 1.0],
  ['s6_close', durations.s6_close + PRE + POST + 0.4],
  ['end', 6],
].filter(([id]) => only.length === 0 || only.includes(id));

// Placeholders stay out of the picture until the team fills them in
const team = Object.fromEntries(Object.entries(narration.team).map(([k, v]) => [k, /^\[.*\]$/.test(v) ? '' : v]));

const browser = await chromium.launch({ channel: 'chrome', args: ['--force-device-scale-factor=1', '--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(sceneDir, 'scenes.html')).href);
await page.evaluate(([cues, t]) => window.setup(cues, t), [timings, team]);

for (const [id, length] of plan) {
  const dir = path.join(outDir, id);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const frames = Math.round(length * FPS);
  const t0 = Date.now();
  for (let f = 0; f < frames; f += 1) {
    const t = f / FPS - (id === 'end' ? 0 : PRE);
    await page.evaluate(([s, tt]) => { window.renderAt(s, tt); return window.imagesReady(); }, [id, t]);
    await page.screenshot({ path: path.join(dir, `f${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 92 });
  }
  console.log(id, frames, 'frames in', ((Date.now() - t0) / 1000).toFixed(0), 's');
}
await browser.close();
