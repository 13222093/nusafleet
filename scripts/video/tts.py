"""Narration for the NusaFleet video with Kokoro-82M (Apache-2.0), fully local.

Usage:
    uv run --no-project --with kokoro-onnx --with soundfile python -I scripts/video/tts.py <model_dir> <out_dir>

<model_dir> holds kokoro-v1.0.onnx and voices-v1.0.bin from
https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
Writes one WAV per scene plus durations.json.
"""

import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

HERE = Path(__file__).resolve().parent
PAUSE_S = 0.35  # breath between sentences


def main() -> None:
    model_dir, out_dir = Path(sys.argv[1]), Path(sys.argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)
    spec = json.loads((HERE / "narration.json").read_text(encoding="utf-8"))
    tts = Kokoro(str(model_dir / "kokoro-v1.0.onnx"), str(model_dir / "voices-v1.0.bin"))
    durations = {}
    timings = {}
    for scene in spec["scenes"]:
        # Sentence by sentence, with a short breath between, reads more like a person
        chunks = []
        rate = 24000
        cues = []
        cursor = 0
        for sentence in [s.strip() for s in scene["text"].replace("? ", "?|").replace(". ", ".|").replace(": ", ":|").split("|") if s.strip()]:
            audio, rate = tts.create(sentence, voice=spec["voice"], speed=spec["speed"], lang="en-us")
            cues.append({"start": round(cursor / rate, 3), "end": round((cursor + len(audio)) / rate, 3), "text": sentence})
            chunks.append(audio)
            gap = np.zeros(int(rate * PAUSE_S), dtype=audio.dtype)
            chunks.append(gap)
            cursor += len(audio) + len(gap)
        audio = np.concatenate(chunks[:-1])
        sf.write(out_dir / f"{scene['id']}.wav", audio, rate)
        durations[scene["id"]] = round(len(audio) / rate, 2)
        timings[scene["id"]] = cues
        print(scene["id"], durations[scene["id"]], "s")
    (out_dir / "durations.json").write_text(json.dumps(durations, indent=2))
    (out_dir / "timings.json").write_text(json.dumps(timings, indent=2))
    print("total", round(sum(durations.values()), 1), "s")


if __name__ == "__main__":
    main()
