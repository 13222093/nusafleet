# NusaFleet: video script and production kit

Target length 3:30. English throughout. Answers the set question: "What do you think is the most important challenge facing maritime affairs today, and why?"

Fill the three placeholders before recording: `[TEAM NAME]`, `[INSTITUTION]`, `[MEMBER NAMES]`.

Who makes what:

| Part | Made with |
| --- | --- |
| Narration (scenes 1, 3, 4, 5) | ElevenLabs Text to Speech |
| Music and sound effects | ElevenLabs Music and Sound Effects |
| Opening clip and illustrations | ElevenLabs Image & Video |
| Product demo | Screen recording of the dashboard in EN mode |
| Introduction and closing (scenes 2, 6) | The team on camera |
| Edit, captions, export | ElevenLabs Studio |

## Script

### Scene 1. Hook (0:00 to 0:18), narrator

Visual: generated clip A, then clip B.

> Indonesia is seventeen thousand islands. For millions of people, the road to school, to hospital and to market is a ferry. Many of those ferries are old, burn diesel, and stay in port when the waves rise. In July 2025 one of them, the Tunu Pratama Jaya, sank in the Bali Strait.

### Scene 2. Introduction (0:18 to 0:38), team on camera

> We are [TEAM NAME] from [INSTITUTION]: [MEMBER NAMES]. We believe the most important challenge in maritime affairs today is keeping island communities connected by sea, safely and cleanly.

### Scene 3. The challenge (0:38 to 1:25), narrator

Visual: illustration 1 (the islands), illustration 2 (three decisions), then the cooperation strip from the dashboard.

> Take North Maluku. Ternate, Tidore, Halmahera and Morotai depend on five ferry routes that carry about five thousand passengers a day. By our estimate, the seven diesel ferries on those routes cost seventy-four billion rupiah a year to run and emit nine and a half thousand tonnes of CO2.
>
> Renewing a fleet is three decisions made at once: which ship, on which route, charged at which port. Today those decisions are made one vessel at a time, without data on waves, passengers or power.
>
> And the timing matters. In June 2026 Russia and Indonesia formed a shipbuilding working group that offers greener ship designs. In October 2026 Rosatom agreed to supply power from two floating units to North Halmahera. New ships and new electricity are heading for the same province. The plan for using them has to come first.

### Scene 4. NusaFleet (1:25 to 2:35), narrator over the screen recording

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

Visual: the "Indonesia × Russia" page, then the requirement sheet.

> For Russia and Indonesia, NusaFleet produces something shipbuilders can use: a requirement sheet for every new vessel. Passengers, speed, range, wave limit and charging power, route by route. We propose handing that sheet to the shipbuilding working group, running one pilot route, and keeping the data together with students from both countries. The model is open source, built on the optimisation engine of team Kopibara.

### Scene 6. Closing (3:05 to 3:30), team on camera

> Island communities need ferries that sail on time, in any season, without poisoning the sea they cross. We are the generation that will ride those ferries and build them. NusaFleet is where we start. Thank you.

## Demo click path (scene 4, 70 seconds)

Record at 1920x1080, browser zoom 100%, language set to EN. Move the mouse slowly and pause one second after each click.

| Time | Action | What the viewer sees |
| --- | --- | --- |
| 1:25 | Page open on Plan, 2026, Balanced | Map, the three headline numbers |
| 1:33 | Press the play button (left of the 2026 pill) | Scenario steps 2026, 2027, 2031 |
| 1:45 | Click 2026, then Cheapest, Balanced | Fleet and numbers change |
| 1:52 | Hold on the headline numbers | Cost, CO2, trips |
| 2:02 | Click 2031, then Cleanest | Charging stations appear, electric and hybrid routes |
| 2:12 | Click the Ternate to Jailolo route | Route panel: today against the plan |
| 2:18 | Close the panel, open the What if tab, drag Diesel price right | Plan re-solves |
| 2:26 | Press Save alternative, open the Alternatives tab | Saved plans side by side |
| 2:31 | Open Report | Report page with Print / save as PDF |

For scene 5: open Indonesia × Russia, hold on the three columns for four seconds, then scroll to "The new vessels needed".

## ElevenLabs prompts

### Narration (Text to Speech)

Voice: a calm documentary narrator, mid-paced. Paste one scene at a time so each can be regenerated on its own. Stability a little above the midpoint, speed 0.95.

### Video clips (Image & Video)

No on-screen text in any clip. 16:9, 6 to 8 seconds each.

- **Clip A, opening.** "Aerial drone shot at dawn over a chain of small green volcanic islands in eastern Indonesia, calm turquoise sea, a white passenger ferry crossing between two islands leaving a long wake, soft golden light, cinematic, slow forward camera move, photorealistic."
- **Clip B, rough sea.** "An old steel roll-on roll-off passenger ferry pushing through grey choppy waves in a tropical strait under heavy cloud, spray over the bow, handheld documentary style from a nearby boat, muted colours, photorealistic, no people in close-up."
- **Clip C, harbour.** "A small Indonesian island ferry port in the morning, passengers and motorbikes waiting on a concrete pier, an ageing ferry docked with its ramp down, volcano in the background, warm natural light, slow pan, documentary style."
- **Clip D, closing.** "A modern white and teal passenger ferry gliding quietly across calm blue water between forested islands at sunset, seen from above, gentle camera rise, hopeful mood, photorealistic."

### Illustrations (Image)

Flat vector style, deep teal and mint palette on a dark navy background, no text, 16:9.

- **Illustration 1, the islands.** "Minimal flat vector map of a cluster of tropical islands on a dark navy sea, five curved dotted ferry routes connecting small glowing port dots, teal and mint colour palette, clean infographic style, no labels, no text."
- **Illustration 2, three decisions.** "Flat vector infographic showing three simple icons in a row connected by thin lines: a ferry, a curved route between two islands, and a charging plug at a pier, teal and mint on dark navy, generous spacing, no text."
- **Illustration 3, two partners.** "Flat vector illustration of two shipyards on opposite shores facing each other across calm water, a ferry blueprint drawn as thin mint lines between them, dark navy background, teal accents, no flags, no text."

### Music

"Calm, hopeful cinematic underscore, 100 BPM, soft piano and warm strings with a light pulse, gentle build from the one minute mark, no vocals, 3 minutes 30 seconds, fades out at the end." Keep it about 18 dB under the narration.

### Sound effects

- "Gentle ocean waves against a hull, steady, 20 seconds" (scenes 1 and 6).
- "Distant ferry horn, single long blast, harbour ambience" (start of scene 1).
- "Soft interface click" (each click in the demo, low volume).

## Assembly in Studio

1. Lay the narration clips on one track in scene order and trim the gaps to about half a second.
2. Place clips A and B over scene 1, the team footage for scenes 2 and 6, illustrations for scene 3, the screen recording for scenes 4 and 5, and clip D under the last line.
3. Add music under everything, sound effects where marked.
4. Turn on English captions.
5. End card, five seconds: "NusaFleet. [TEAM NAME], [INSTITUTION]. Optimisation engine adapted from team Kopibara (MIT license). Narration, music and illustrations generated with ElevenLabs."
6. Export 1080p, upload, set the link to "Anyone with the link can view", and test it in a private window.
