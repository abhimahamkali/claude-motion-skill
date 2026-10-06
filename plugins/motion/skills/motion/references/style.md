# Visual language and rules

This style came out of real iterations with the owner of this skill. A first pass that used cartoon dogs, kibble and bold sans headlines was rejected as *"text heavy"*, and then as *"very childish"*. What was approved: an analogy that carries the message, abstract light and gradients, and subtle text.

## Look
- **Two acts, dark to light.** Open in a deep, luminous dark gradient (forest green → teal is the house default: `#03170F → #06382A → #0E6F4C`, glowing up from the bottom). Resolve in a pale, airy gradient (`#FBFDF0 → #EAF6D6 → #D2EDB8`). Cut between them with `bloom()`.
- **Light, not illustration.** Lines are luminous hairlines (`glowStroke`), energy is glow sprites with additive blending (`'lighter'`), and motion has comets travelling on circles. Thin circles that cross the frame make a strong opening, like the rings that frame a centred word.
- **Objects are allowed, characters aren't.** Fruit, vessels and natural forms are welcome, drawn as clean flat shapes with gradients, highlights and fine detail (seeds, rind bands, crowns). No faces, eyes, mascots or cartoon animals unless the user asks for them.
- **Colour with intent.** One accent family per idea, for example coral to ruby for "dense and rich" and lime/mint for "energy". Use **opaque fills** for object bodies: translucent warm colours over a green background turn muddy brown.
- **Always finish with `finishFrame(t)`** (moving grain plus vignette). Without the grain, H.264 bands the gradients.
- **The camera breathes.** A slow push-in across the dark act (1.00 → ~1.07) and slow drifts and bobs make it feel alive. Nothing should ever be completely static.

## Text
- **Subtle and few.** At most one text block per beat, about 3–4 blocks across the whole piece.
- **Caption trio** via `caption()`: SMALL-CAPS SANS LABEL (27px, tracked) / *Serif italic statement* (80px) / sans subline (35px, ~60% opacity).
- **Hook statement:** one serif italic line, centred in the opening composition (≤ 5 words).
- **Closing line:** the single sentence the viewer should leave with, serif italic, ~90–100px, dark ink on the light act.
- Text reveals letter by letter (`softText`) and fades before the next beat. It never cuts.
- Don't use numbers, formulas or maths unless the user asks for them.

## Composition: 9:16 safe zones (Instagram/TikTok)
- Keep text between **y ≈ 260 and 1550**. The top ~220px and the bottom ~350px are covered by app UI, and the right edge (x > 950, y 1100–1700) has the action buttons.
- Put captions in the upper third (y ≈ 300–450) and the hero object around y ≈ 900–1100.
- Keep a 70px side margin for anything readable.

## Motion
- Ease everything: `eOut3/eOut5` for arrivals, `eInOut` for transformations, `eBack` for small pops. Nothing should move linearly unless it's ambient drift.
- One hero transformation, 2–3 s long, continuous. Morph one thing into the next instead of cutting. Elements should persist and change (the same specks become the seeds).
- Energy should read as rhythm: pulse rings whose frequency rises as the idea intensifies, and fast comets orbiting at the climax.
- Stagger groups (0.02–0.2 s per item) so they don't all land on the same frame.
- Leave about 1.5 s of hold on the final frame.

## Review checklist (stills and the final sheet)
1. Can you tell what the objects are without any text?
2. Does the turn read as one continuous change, and is the before/after obvious? A ghost outline of the old size helps.
3. Any muddy colours, banding, or dead flat areas?
4. Is all text legible at phone size, unclipped, and inside the safe zones?
5. Do any elements pop in before their beat or linger after it? Check the first 3 s especially.
6. Does any frame look empty (no focus) or crowded (more than one focus)?
7. Is the last frame a good thumbnail and end card?

## Canvas gotchas that cost real time
- `ctx.arc` throws on a negative radius. Anything scaled by an `eBack` or a shrinking value must be clamped (use `circle()`); a throw stalls the render.
- Nested `ctx.globalAlpha = x` overrides a parent fade. Multiply instead (`ctx.globalAlpha *= x`) so exits fade everything.
- Objects hidden "behind" something still draw at their start position before their entrance. Return early when entrance progress is ≤ 0.
- Additive `'lighter'` saturates fast. Lower the alpha as density rises, and add a white core only at the climax.
- Big canvases plus grain make large PNG frames. That's fine for the renderer, but the full MP4 lands around 30–50 MB, so ship the `--share` copy for chat.
