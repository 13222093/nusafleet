# NusaFleet: video script and production kit

Target length 3:30. English throughout. Answers the set question: "What do you think is the most important challenge facing maritime affairs today, and why?"

Fill the three placeholders before recording: `[TEAM NAME]`, `[INSTITUTION]`, `[MEMBER NAMES]`.

## The idea: the chart comes alive

The dashboard looks like a sea chart at night: dark teal water, mint route lines. Every generated shot uses that same look, so the film reads as one piece. The opening ends on a top-down shot of a ferry drawing a glowing line between two islands, and that shot dissolves straight into the real map in the demo.

Who makes what:

| Part | Made with | Status |
| --- | --- | --- |
| Narration, scenes 1, 3, 4, 5 | ElevenLabs Text to Speech | to generate |
| Five video clips | ElevenLabs Image & Video, Video tab | to generate |
| Four illustrations | ElevenLabs Image & Video, Image tab | to generate |
| Music | ElevenLabs Music | to generate |
| Six sound effects | ElevenLabs Sound Effects | to generate |
| Product demo, scenes 4 and 5 | Screen recording of the dashboard | done: `video/demo_scene4.mp4` (94 s), `video/demo_scene5.mp4` (54 s) |
| Introduction and closing, scenes 2 and 6 | The team on camera | to film |

## Script

### Scene 1. Hook (0:00 to 0:18), narrator

Picture: V1, then V2, then V3. Sound: horn, rain, waves.

> Indonesia is seventeen thousand islands. For millions of people, the road to school, to hospital and to market is a ferry. Many of those ferries are old, burn diesel, and stay in port when the waves rise. In July 2025 one of them, the Tunu Pratama Jaya, sank in the Bali Strait.

### Scene 2. Introduction (0:18 to 0:38), team on camera

> We are [TEAM NAME] from [INSTITUTION]: [MEMBER NAMES]. We believe the most important challenge in maritime affairs today is keeping island communities connected by sea, safely and cleanly.

### Scene 3. The challenge (0:38 to 1:25), narrator

Picture: I1 with the three numbers typed over it, then I2, then I3, then V4.

> Take North Maluku. Ternate, Tidore, Halmahera and Morotai depend on five ferry routes that carry about five thousand passengers a day. By our estimate, the seven diesel ferries on those routes cost seventy-four billion rupiah a year to run and emit nine and a half thousand tonnes of CO2.
>
> Renewing a fleet is three decisions made at once: which ship, on which route, charged at which port. Today those decisions are made one vessel at a time, without data on waves, passengers or power.
>
> And the timing matters. In June 2026 Russia and Indonesia formed a shipbuilding working group that offers greener ship designs. In October 2026 Rosatom agreed to supply power from two floating units to North Halmahera. New ships and new electricity are heading for the same province. The plan for using them has to come first.

### Scene 4. NusaFleet (1:25 to 2:35), narrator over the demo

Picture: V4 dissolves into `demo_scene4.mp4`.

> So we built NusaFleet. It answers one question: which ship should sail which route, and where should it charge?
>
> You pick a power scenario: today's grid, grid plus solar, or the floating power units in 2031. You pick a priority, from cheapest to cleanest. An optimisation model then chooses the fleet for every route and the ports that get charging stations.
>
> In the balanced plan, new ferries cut CO2 by a third and save 1.8 billion rupiah a year. They also handle higher waves, so ninety-three more trips sail each year.
>
> Move to the cleanest plan in 2031 and the map changes. An electric ferry runs Ternate to Jailolo, hybrids serve Sofifi and Morotai, three ports get charging stations, and emissions fall by half.
>
> Click a route to compare today with the plan. Change the diesel price and the plan re-solves in seconds. Save the alternatives you like and export a report.

### Scene 5. Russia and Indonesia (2:35 to 3:05), narrator

Picture: `demo_scene5.mp4`.

> For Russia and Indonesia, NusaFleet produces something shipbuilders can use: a requirement sheet for every new vessel. Passengers, speed, range, wave limit and charging power, route by route. We propose handing that sheet to the shipbuilding working group, running one pilot route, and keeping the data together with students from both countries. The model is open source, built on the optimisation engine of team Kopibara.

### Scene 6. Closing (3:05 to 3:30), team on camera, then V5

> Island communities need ferries that sail on time, in any season, without poisoning the sea they cross. We are the generation that will ride those ferries and build them. NusaFleet is where we start. Thank you.

## ElevenLabs asset list

Generate each asset, save it under the file name given, and send the files back. Twenty files in total.

### A. Voice. Tool: Text to Speech. Model: Eleven v3

Create the voice first in **Voices, Voice Design** with this description, then use it for all four files:

> A woman in her late twenties from Indonesia speaking fluent English with a light Indonesian accent. Warm, steady and unhurried, like a documentary narrator who grew up beside the sea. Close studio microphone, no background noise.

| File | Text to paste | Aim for |
| --- | --- | --- |
| `vo_s1.mp3` | Scene 1 | 18 s |
| `vo_s3.mp3` | Scene 3 | 47 s |
| `vo_s4.mp3` | Scene 4 | 70 s |
| `vo_s5.mp3` | Scene 5 | 30 s |

Settings: stability around 55, speed 0.95. If a file runs long, raise speed to 1.0 and regenerate that file only.

### B. Video clips. Tool: Image & Video, Video tab. Model: Veo 3.1 (or Kling 2.5)

All clips: 16:9, 8 seconds, no on-screen text, no dialogue.

| File | Scene | Prompt |
| --- | --- | --- |
| `v1_islands.mp4` | 1 | High aerial shot at blue hour over a dark teal sea scattered with small volcanic islands in eastern Indonesia. Tiny warm lights of ferries move between the islands and leave faint glowing trails, like a constellation being drawn on the water. Slow forward drift, cinematic, photorealistic. |
| `v2_crossing.mp4` | 1 | Deck-level shot on an old steel passenger ferry in a tropical strait under heavy grey cloud. Passengers seen from behind as silhouettes at the railing, rain blowing sideways, a volcano island ahead in the mist. Handheld documentary feel, muted colours, photorealistic. |
| `v3_port.mp4` | 1 | A small island ferry pier in rain. An ageing ferry is tied up and not sailing, waves slapping the concrete. In the foreground an empty waiting bench with a single school backpack on it. Static shot, shallow focus on the backpack, overcast light, photorealistic. |
| `v4_matchcut.mp4` | 3 into 4 | Perfectly vertical top-down shot of a dark teal sea at night with two islands as darker shapes. One small ferry crosses between them and its wake glows soft mint green, drawing a single smooth curved line from one island to the other. Camera locked, no tilt, no rotation, minimal, graphic, like a living nautical chart. |
| `v5_morning.mp4` | 6 | Sunrise at a clean island pier. A modern white and teal ferry arrives quietly on calm water. Children in school uniforms seen from behind walk down the ramp toward it. Warm golden light, slow rising camera, hopeful, photorealistic. |

Tip for `v4_matchcut.mp4`: generate a still of the frame first in the Image tab, then use it as the start image for the video. It keeps the camera locked.

### C. Illustrations. Tool: Image & Video, Image tab. Model: Nano Banana (or Seedream)

All images: 16:9, no text, no labels, no flags. Shared style line to put at the end of every prompt:

> Hand-inked nautical chart style, thin mint green lines on deep teal paper, faint half-degree grid, subtle paper grain, lots of empty space.

| File | Scene | Prompt (add the style line) |
| --- | --- | --- |
| `i1_chart.png` | 3 | A cluster of tropical islands seen from above with five curved dotted ferry routes joining small glowing port dots, a small compass rose in one corner. Leave the right third of the frame empty for numbers. |
| `i2_decisions.png` | 3 | Three simple hand-inked icons in a row joined by a thin line: a ferry, a curved route between two islands, a charging plug on a pier. Evenly spaced, centred. |
| `i3_shipyards.png` | 3 | Two shipyards on opposite shores of a calm strait, each with a crane. Between them the outline of a ferry drawn as a blueprint in thin lines, as if both sides are sketching the same ship. |
| `i4_endcard.png` | end | Open dark teal sea with one curved glowing mint route crossing the lower third and a small compass rose. The upper two thirds empty for the end card text. |

### D. Music. Tool: Music

File: `music.mp3`, length 3:30, instrumental.

> Cinematic documentary underscore, instrumental, 3 minutes 30 seconds. Opens sparse: low sustained strings and distant soft bronze metallophone notes inspired by Indonesian gamelan, like light on water. At 0:40 a slow felt piano joins. At 1:25 a light steady pulse and warm plucked strings enter, confident and forward-moving. At 2:35 the pulse eases and the strings warm up. From 3:05 it resolves on a hopeful major chord and fades out by 3:30. No drums, no vocals.

### E. Sound effects. Tool: Sound Effects

| File | Scene | Prompt | Length |
| --- | --- | --- | --- |
| `sfx_horn.mp3` | 1 | One long distant ferry horn across open water, slight echo | 5 s |
| `sfx_rain_deck.mp3` | 1 | Steady rain and wind on a steel ship deck, engine hum underneath | 10 s |
| `sfx_waves_pier.mp3` | 1 | Waves slapping a concrete pier, a mooring rope creaking | 8 s |
| `sfx_whoosh.mp3` | 3 into 4 | Soft low whoosh rising into a gentle shimmer, for a dissolve | 2 s |
| `sfx_click.mp3` | 4 and 5 | Single soft interface click, short and dry | 1 s |
| `sfx_harbour_morning.mp3` | 6 | Calm morning harbour, small waves, a few seabirds, distant voices | 12 s |

## Assembly

1. Narration on one track in scene order.
2. Picture as listed under each scene. The demo footage is longer than the narration on purpose; it is trimmed to the voice.
3. Three numbers typed over `i1_chart.png` in scene 3: "5 routes", "74 bn rupiah a year", "9,500 t CO2 (estimate)".
4. `v4_matchcut.mp4` dissolves into the demo over one second, with `sfx_whoosh.mp3`.
5. Music under everything at about 18 dB below the voice. Sound effects where marked.
6. English captions on.
7. End card over `i4_endcard.png`, five seconds: "NusaFleet. [TEAM NAME], [INSTITUTION]. Optimisation engine adapted from team Kopibara (MIT license). Narration, music and illustrations generated with ElevenLabs."
8. Export 1080p, upload, set the link to "Anyone with the link can view", and test it in a private window.
