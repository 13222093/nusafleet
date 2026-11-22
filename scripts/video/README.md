# Video pipeline (LAUTARA 2026, stage 1)

Everything here runs locally; nothing needs an account.

1. Narration: `uv run --no-project --with kokoro-onnx --with soundfile python -I scripts/video/tts.py <kokoro_dir> <build>/vo`
   (Kokoro-82M, Apache-2.0, voice `af_heart`; model files from the kokoro-onnx `model-files-v1.0` release). Text and team names live in `narration.json`.
2. Demo footage: `node scripts/video/record_demo.mjs <build>/demo https://nusafleet.vercel.app` (run from a folder with `playwright`; drives installed Chrome at 1440x810).
3. Motion scenes: copy `scenes.html`, `chart.jpg` (sea texture from `scripts/twin/make_dem.py`) and the Archivo woff2 files into `<build>/scene`, then `node scripts/video/render_scenes.mjs <build>/scene <build>/vo <build>/frames`.
4. Assembly: `node scripts/video/assemble.mjs <build> <ffmpeg.exe>` writes `nusafleet_lautara2026.mp4` (1080p30, captions burned in, -16 LUFS).

To add the team: fill `team` in `narration.json`, change the `s2_intro` text to name the team, then rerun steps 1, 3 (`s2_intro end`) and 4.
