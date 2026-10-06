---
name: motion
description: Generate a 10–15 second motion graphic (default 9:16 reel, 1080x1920 MP4) from a short brief, script or idea — premium gradient/light style, a visual analogy that carries the message, minimal elegant text. Use when the user runs /motion, or asks for a motion graphic, animated explainer, reel animation, or "animate this script/idea".
argument-hint: [what the motion graphic should explain or show]
---

# /motion — brief in, finished MP4 out

You turn a brief into a short, beautiful motion graphic by writing a canvas scene (`scene.html`) and rendering it frame-by-frame to MP4 with headless Chrome + ffmpeg.

**Brief:** $ARGUMENTS

If the brief is empty, ask once what it should explain (and offer: "or paste a script and I'll find the one idea in it").

The engine sits in `engine/` inside this skill's base directory (shown above when this skill loads):
- `engine/template.html` — the scene scaffold: easing, glow sprites, luminous strokes, comets, pulses, letter-by-letter text, backgrounds, bloom transitions, grain, and the render hook. **Start every piece from a copy of it.**
- `engine/render.mjs` — the renderer (no npm install needed; Node 18+, Chrome/Edge, ffmpeg).
- `examples/watermelon-to-pomegranate.html` — a complete, approved piece. Read it before writing your first scene: it shows the quality bar and how the helpers combine.
- `references/style.md` — the visual language and the rules that came out of real feedback. Read it every time.

## Workflow

### 0. Preflight (first run only)
```
node "<skill-dir>/engine/render.mjs" --check
```
If Chrome or ffmpeg is missing, tell the user exactly what to install (ffmpeg: `winget install Gyan.FFmpeg` / `brew install ffmpeg` / `apt install ffmpeg`) and stop.

### 1. Find the one idea, then the analogy
- Boil the brief down to **one sentence** the viewer should leave with. If the brief is a script, ignore the maths and the detail; take the single turn of thought.
- Pick a **visual analogy made of concrete, recognisable things** (fruit, light, water, objects) that *shows* that sentence without words. The analogy does the talking; text only names what we're seeing. Example: "a smaller portion has to be denser" → a big watery watermelon that shrinks and turns into a pomegranate packed with seeds; the same energy specks become packed seeds.
- If the user named an analogy, use theirs.

### 2. Storyboard (say it, don't wait)
Write 4–6 beats with timings in chat, one line each: what moves, and the text on screen (if any). Total 10–15 s (default 12–14). Shape:
1. **Hook (0–2.5 s)**: atmosphere drawing in plus one short statement (≤ 5 words).
2. **Set-up**: the first object/state appears, with an optional quiet caption.
3. **The turn**: one continuous transformation that *is* the idea (a morph, a compression, something filling up). This is the hero moment, ~2–3 s, eased.
4. **Proof**: the result held for a beat, with energy visible (pulses quicken, orbits, glow).
5. **Resolve (last 3–4 s)**: bloom into a calm light scene and the closing line.

Then build it straight away. Only stop to ask if the brief is genuinely ambiguous.

### 3. Build the scene
- Make a working folder: `./motion/<short-slug>/` in the current directory (or where the user says). Copy `engine/template.html` there as `scene.html`.
- Set `W, H, FPS, DUR` in CONFIG (9:16 = 1080x1920 unless the user asks for 4:5, 1:1 or 16:9).
- Replace only the SCENE section. Put timings in one `T = {...}` object so beats are easy to shift.
- `draw(t)` must be a **pure function of t**: no state carried between frames and no `Math.random()` (use `rng(seed)` at load time).
- Follow `references/style.md`.

### 4. Review stills before the full render (always)
```
node "<skill-dir>/engine/render.mjs" ./motion/<slug>/scene.html --stills 1.5,4,6.5,9,12
```
Pick one time inside each beat. **Read `stills/sheet.png`** and critique it hard against the checklist in `references/style.md`: does it read as the analogy, are any colours muddy, is any text clipped or too small, is anything sitting in the Instagram UI zones, does any frame look empty or cluttered? Fix and re-shoot until it passes. For detail, Read a single `stills/t<sec>.png`.

### 5. Render, then verify the real file
```
node "<skill-dir>/engine/render.mjs" ./motion/<slug>/scene.html --out ./motion/<slug>/<Name>_9x16.mp4 --sheet --share
```
- Takes ~1–3 minutes for 12 s. Run it in the background if your harness supports that.
- **Read the `_sheet.png`** (one frame per second) to confirm the whole timeline, not just the stills.
- `--share` writes `<Name>_9x16_share.mp4` (~5–10 MB) for phones and chat. The full file can be 30–50 MB because of the grain; that's expected and it's the one to post.

### 6. Deliver
Send or link the MP4 (send the `_share` copy where there's an upload limit). In the reply, list the beats as they now play (time → what happens → on-screen text), note that there's **no audio**, and name the sync points worth a sound (impacts, morphs, bloom). Mention that `scene.html` opens in a browser as a live looping preview and is the thing to edit for changes.

## Iterating on feedback
- Change the scene, re-run stills for the beats you touched, then render again. Keep earlier MP4s; write new versions to new names (`_v2`).
- "Too childish" → drop characters and faces, move to abstract light and gradients, use a serif italic for statements.
- "Too much text" → keep at most one short statement per beat and let the objects carry it.
- "Doesn't explain it" → make the analogy objects more literal (recognisable silhouettes, colour, texture) and add a quiet caption trio (label / statement / subline).

## When the render fails
- `PAGE ERROR` with a stack and `t=`: `draw()` threw at that time. The usual cause is a negative radius in `ctx.arc` (use `circle()`, which clamps). Fix it and re-run.
- `stalled at frame N`: an infinite loop or a throw outside the try. Bisect with `--stills` around `N/30` s.
- Fonts not loaded (`fonts loaded: false`): there's no network for Google Fonts; switch to system fonts in CONFIG.
