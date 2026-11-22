// Assembles the NusaFleet video: scene clips, crossfades, narration, a quiet
// sea bed under it, and burned-in English captions.
//
// Usage: node assemble.mjs <build_dir> <ffmpeg.exe> [out.mp4]
// <build_dir> holds frames/<scene>/f*.jpg, demo/<s4|s5>/frames.ffconcat and vo/.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const [BUILD, FFMPEG, OUT = 'nusafleet_lautara2026.mp4'] = process.argv.slice(2);
const PRE = 0.3;
const POST = 0.6;
const dur = JSON.parse(fs.readFileSync(path.join(BUILD, 'vo', 'durations.json'), 'utf8'));
const cues = JSON.parse(fs.readFileSync(path.join(BUILD, 'vo', 'timings.json'), 'utf8'));
const clipsDir = path.join(BUILD, 'clips');
fs.mkdirSync(clipsDir, { recursive: true });

const ff = (args, cwd = BUILD) => execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { cwd, stdio: 'inherit' });

// [id, source, length, fade into this clip, voice id]
const plan = [
  ['s1_hook', 'frames', dur.s1_hook + PRE + POST, 0, 's1_hook'],
  ['s2_intro', 'frames', dur.s2_intro + PRE + POST, 0.5, 's2_intro'],
  ['s3_challenge', 'frames', dur.s3_challenge + PRE + POST + 1.0, 0.5, 's3_challenge'],
  ['s4', 'demo', dur.s4_product + PRE + POST, 0.9, 's4_product'],
  ['s5', 'demo', dur.s5_coop + PRE + POST, 0.5, 's5_coop'],
  ['s6_close', 'frames', dur.s6_close + PRE + POST + 0.4, 0.5, 's6_close'],
  ['end', 'frames', 6, 0.6, null],
];

// 1. One silent 30 fps clip per scene
for (const [id, src, len] of plan) {
  const out = path.join(clipsDir, `${id}.mp4`);
  const enc = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', '30', '-an'];
  if (src === 'frames') {
    ff(['-framerate', '30', '-i', path.join('frames', id, 'f%05d.jpg'), '-t', len.toFixed(3), ...enc, out]);
  } else {
    // Demo frames carry real timestamps; hold the last frame to the narration's length
    // Two passes: the concat demuxer ends the stream at its last frame, so the hold is added after
    const raw = path.join(clipsDir, `${id}_raw.mp4`);
    ff(['-f', 'concat', '-safe', '0', '-i', 'frames.ffconcat', '-vf', 'fps=30,scale=1920:1080:flags=lanczos', ...enc, raw], path.join(BUILD, 'demo', id));
    ff(['-i', raw, '-vf', 'tpad=stop_mode=clone:stop_duration=30', '-t', len.toFixed(3), ...enc, out]);
  }
  console.log('clip', id, len.toFixed(2), 's');
}

// 2. Start time of each clip in the final timeline
const starts = [];
let cursor = 0;
plan.forEach(([, , len, fadeIn], i) => {
  const start = i === 0 ? 0 : cursor - fadeIn;
  starts.push(start);
  cursor = start + len;
});
const total = cursor;

// 3. Picture: crossfade chain
const vInputs = plan.flatMap(([id]) => ['-i', path.join('clips', `${id}.mp4`)]);
let vf = '';
let last = '[0:v]';
plan.slice(1).forEach(([, , , fadeIn], k) => {
  const i = k + 1;
  const tag = i === plan.length - 1 ? '[vx]' : `[v${i}]`;
  vf += `${last}[${i}:v]xfade=transition=fade:duration=${fadeIn}:offset=${starts[i].toFixed(3)}${tag};`;
  last = tag;
});

// 4. Captions (ASS), one line per spoken sentence
const t2a = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = (s % 60).toFixed(2).padStart(5, '0');
  return `${h}:${String(m).padStart(2, '0')}:${sec}`;
};
const wrap = (text, max = 64) => {
  const words = text.split(' ');
  const lines = [''];
  for (const w of words) {
    if ((lines.at(-1) + ' ' + w).trim().length > max) lines.push(w);
    else lines[lines.length - 1] = (lines.at(-1) + ' ' + w).trim();
  }
  return lines.join('\\N');
};
const ass = [
  '[Script Info]', 'ScriptType: v4.00+', 'PlayResX: 1920', 'PlayResY: 1080', 'WrapStyle: 2', '',
  '[V4+ Styles]',
  'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
  // Ink text on a paper box, bottom centre
  'Style: Cap,Segoe UI,38,&H00171410,&H00171410,&H18F8F7F4,&H18F8F7F4,0,0,0,0,100,100,0,0,3,14,0,2,200,200,46,1',
  '', '[Events]', 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
];
plan.forEach(([, , , , vo], i) => {
  if (!vo) return;
  for (const c of cues[vo]) {
    const s = starts[i] + PRE + c.start;
    const e = starts[i] + PRE + c.end + 0.15;
    const text = c.text.replace(/twenty twenty-five/g, '2025').replace(/twenty twenty-six/g, '2026').replace(/twenty thirty-one/g, '2031').replace(/one point eight billion/g, '1.8 billion');
    ass.push(`Dialogue: 0,${t2a(s)},${t2a(e)},Cap,,0,0,0,,${wrap(text)}`);
  }
});
fs.writeFileSync(path.join(BUILD, 'captions.ass'), ass.join('\n'));

// 5. Sound: narration placed per scene, a quiet sea and a low drone under it
const voices = plan.map(([, , , , vo], i) => (vo ? { vo, at: starts[i] + PRE } : null)).filter(Boolean);
const aInputs = voices.flatMap(({ vo }) => ['-i', path.join('vo', `${vo}.wav`)]);
const base = plan.length;
let af = '';
voices.forEach(({ at }, k) => {
  af += `[${base + k}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${Math.round(at * 1000)}|${Math.round(at * 1000)},apad=whole_dur=${total.toFixed(3)}[n${k}];`;
});
af += `${voices.map((_, k) => `[n${k}]`).join('')}amix=inputs=${voices.length}:normalize=0:duration=longest,atrim=duration=${total.toFixed(3)},loudnorm=I=-16:TP=-1.5:LRA=11[voice];`;
// Sea: brown noise, low-passed, breathing slowly. Drone: a soft open fifth.
af += `anoisesrc=color=brown:amplitude=0.6:sample_rate=48000:duration=${total.toFixed(3)},lowpass=f=420,highpass=f=60,tremolo=f=0.1:d=0.55,volume=-30dB,aformat=channel_layouts=stereo[sea];`;
af += `sine=f=110:sample_rate=48000:duration=${total.toFixed(3)},volume=-39dB[d1];sine=f=164.81:sample_rate=48000:duration=${total.toFixed(3)},volume=-43dB[d2];sine=f=220:sample_rate=48000:duration=${total.toFixed(3)},volume=-47dB[d3];`;
af += `[d1][d2][d3]amix=inputs=3:normalize=0,tremolo=f=0.13:d=0.35,aformat=channel_layouts=stereo[drone];`;
af += `[sea][drone]amix=inputs=2:normalize=0,afade=t=in:d=2.5,afade=t=out:st=${(total - 3).toFixed(3)}:d=3[bed];`;
af += `[voice][bed]amix=inputs=2:normalize=0:duration=first[ax]`;

const filter = `${vf}[vx]subtitles=captions.ass,fade=t=in:d=0.6,fade=t=out:st=${(total - 0.8).toFixed(3)}:d=0.8[vout];${af}`;
fs.writeFileSync(path.join(BUILD, 'filter.txt'), filter);
ff([...vInputs, ...aInputs, '-filter_complex_script', 'filter.txt', '-map', '[vout]', '-map', '[ax]',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30',
  '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', OUT]);
console.log('wrote', path.join(BUILD, OUT), 'length', total.toFixed(1), 's');
