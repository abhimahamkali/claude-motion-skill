# /motion: motion graphics for Claude Code

Describe an idea and get back a finished **10–15 second motion graphic** (a 1080×1920 MP4 by default).

```
/motion explain why a small dog's food has to be more nutrient-dense than a big dog's
```

Claude finds the one idea in your brief and picks a visual analogy that shows it. It writes the animation as a canvas scene, reviews stills of each beat, renders the video, and checks the result before handing it to you.

https://github.com/abhimahamkali/claude-motion-skill/raw/main/plugins/motion/skills/motion/examples/watermelon-to-pomegranate.mp4

*The example: "a smaller portion has to work harder per gram." A watery watermelon shrinks and turns into a pomegranate, and the same specks of energy become its packed seeds.*

## Install

You can install it as a plugin or copy it in as a standalone skill.

### As a plugin (recommended)
Inside Claude Code:
```
/plugin marketplace add abhimahamkali/claude-motion-skill
/plugin install motion@claude-motion
```
Restart Claude Code, then run `/motion <your brief>`. Plugin skills can also appear namespaced as `/motion:motion`.

### As a standalone skill
```bash
git clone https://github.com/abhimahamkali/claude-motion-skill.git
```
Then copy the skill into your personal skills folder.

macOS / Linux:
```bash
cp -r claude-motion-skill/plugins/motion/skills/motion ~/.claude/skills/motion
```
Windows (PowerShell):
```powershell
Copy-Item -Recurse claude-motion-skill\plugins\motion\skills\motion "$env:USERPROFILE\.claude\skills\motion"
```

## Requirements
- **Node.js 18+**. No npm install is needed, because the renderer uses only built-in modules.
- **Google Chrome, Chromium or Microsoft Edge**, used headless to draw each frame.
- **ffmpeg** on your PATH:
  - Windows: `winget install Gyan.FFmpeg`
  - macOS: `brew install ffmpeg`
  - Linux: `apt install ffmpeg`

To check your setup, run:
```
node plugins/motion/skills/motion/engine/render.mjs --check
```
If Chrome or ffmpeg is installed somewhere unusual, set `CHROME_PATH` or `FFMPEG_PATH` to point at it.

## Usage
```
/motion <what it should explain or show>
```
- Paste a whole script and Claude pulls out the single idea.
- Name an analogy ("use a sponge and a stone") and it uses yours.
- Ask for another format and it changes the canvas: `4:5`, `1:1` or `16:9`.
- Give feedback in plain words ("less text", "too childish", "make the objects more literal") and it iterates.

Output lands in `./motion/<slug>/`:

| File | What it is |
|---|---|
| `scene.html` | The animation source. Open it in a browser for a live, looping preview, and edit it to change things. |
| `<Name>_9x16.mp4` | The full-quality render, for posting. It's ~30–50 MB because of the film grain. |
| `<Name>_9x16_share.mp4` | A small copy (~5–10 MB) for chat and phones. |
| `stills/`, `*_sheet.png` | The review frames Claude used to check its work. |

The video has **no audio**; Claude tells you the moments worth a sound effect.

## How it works
```
plugins/motion/skills/motion/
├── SKILL.md                  the workflow Claude follows
├── references/style.md       visual language, text and safe-zone rules, review checklist
├── engine/template.html      canvas scaffold: easing, glows, luminous strokes, comets, text reveals, grain
├── engine/render.mjs         headless Chrome → ffmpeg renderer (stills, MP4, contact sheet, share copy)
└── examples/                 a complete approved piece (HTML source + MP4)
```
The renderer opens the scene in headless Chrome, and the page draws each frame and posts it back to a local server that pipes it into ffmpeg. The renderer is deterministic: the same scene always renders to the same video.

You can also render by hand:
```
node engine/render.mjs scene.html --stills 1.5,4,8      # review frames + sheet.png
node engine/render.mjs scene.html --out final.mp4 --sheet --share
```
