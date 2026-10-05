---
name: Mann Dev
description: Hand-built studio site for small businesses. Deep navy water, one gold light, serif authority.
colors:
  bg: "#1e2530"
  surface: "#252b34"
  fg: "#f0f2f4"
  mid: "#969ba6"
  dim: "#636872"
  accent: "#f2c94c"
  rule: "#f0f2f417"
  rule-soft: "#f0f2f40f"
  rule-accent: "#f2c94c38"
typography:
  display:
    fontFamily: "'Lora', Georgia, serif"
    fontSize: "clamp(40px, 6vw, 70px)"
    fontWeight: 500
    lineHeight: 1.08
  headline:
    fontFamily: "'Lora', Georgia, serif"
    fontSize: "clamp(30px, 4vw, 52px)"
    fontWeight: 500
    lineHeight: 1.12
  title:
    fontFamily: "'Lora', Georgia, serif"
    fontSize: "clamp(1.8rem, 3vw, 2.8rem)"
    fontWeight: 600
    lineHeight: 1
  card-title:
    fontFamily: "'Lora', Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.2
  numeral:
    fontFamily: "'Lora', Georgia, serif"
    fontSize: "3.5rem"
    fontWeight: 700
    lineHeight: 1
  body:
    fontFamily: "'Figtree', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
  body-small:
    fontFamily: "'Figtree', system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 400
    lineHeight: 1.8
  label:
    fontFamily: "'Figtree', system-ui, sans-serif"
    fontSize: "0.7rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.18em"
rounded:
  hairline: "3px"
  small: "8px"
  option: "14px"
  panel: "20px"
  card: "28px"
  round: "50%"
spacing:
  gutter: "clamp(1.5rem, 5vw, 4rem)"
  container: "1280px"
  section-gap: "96px"
  section-gap-mobile: "64px"
  card-padding: "2.5rem"
components:
  link-cta:
    textColor: "{colors.accent}"
    typography: "{typography.label}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "2.5rem"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
    padding: "1.75rem"
  tag:
    backgroundColor: "transparent"
    textColor: "{colors.accent}"
    typography: "{typography.label}"
    padding: "0.3rem 0.8rem"
  tag-hover:
    backgroundColor: "#f2c94c14"
    textColor: "{colors.accent}"
  badge-filled:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.bg}"
    typography: "{typography.label}"
  input-text:
    backgroundColor: "transparent"
    textColor: "{colors.fg}"
    typography: "{typography.body}"
  choice-option:
    backgroundColor: "transparent"
    textColor: "{colors.fg}"
    rounded: "{rounded.option}"
    padding: "1rem 1.1rem"
  choice-option-selected:
    backgroundColor: "#f2c94c0f"
    textColor: "{colors.fg}"
---

# Design System: Mann Dev

## 1. Overview

**Creative North Star: "Harbour at Dusk"**

The last light over a working harbour: deep water navy going dark, one warm gold line on the horizon, and soft, well-worn forms that have clearly been made by hand. Mann Dev is a small studio selling custom, hand-coded websites, so the page itself has to be the proof. Nothing here is a template: every surface, underline and card lift is built for this site, and the restraint is the confidence.

The system is layered, not flat. The navy field carries a faint printed grain; a large, barely-visible m/d mark turns slowly behind the hero like a harbour light; cards sit a step above the water in a slate fill with a hairline edge, and rise toward you (shadow, gold edge, a few pixels of lift) when you reach for them. Gold is the only colour and it is rationed: text links, underlines, tags, the availability pulse, the one italic word in the hero. Type does the talking: Lora for anything that needs authority, Figtree for everything that needs to work.

This system rejects what PRODUCT.md names as anti-references: "generic SaaS landing pages (bright gradients, hero-metric blocks, stock illustrations)", "bloated agency sites with layers of process jargon and team photos", and "anything that reads as templated, since 'no templates' is a core claim the design must visually back up."

**Key Characteristics:**
- Deep dusk-navy field (never black) with a slate surface one step up; printed grain over everything
- One lamplight gold accent, used on no more than a hairline, a word, or a small tag at a time
- Lora serif for headlines, card titles and numerals; Figtree sans for body, labels and UI
- Generously rounded forms (28px cards, 20px panels, 14px choices)
- No filled buttons: primary CTAs ("Start a project", form submit) are gold outlined buttons; every other action is a gold text link with a drawn underline and a nudging arrow
- Layered depth: grain and the hero mark at rest, lift and gold edges on intent

## 2. Colors: The Harbour Palette

Warm navy water, a slate hull, sea-fog text, and a single lamplight gold.

### Primary
- **Lamplight Gold** (`accent`): The only saturated colour. Text links and their underlines, the nav's standing underline, the active tab indicator, tag and badge text, the availability dot, the italic hero word and its hand-drawn stroke, focus outlines. Never a large fill.

### Neutral
- **Dusk Water** (`bg`): The page. A deep, warm-leaning navy; never pure black, never cool slate.
- **Harbour Slate** (`surface`): Cards, panels and dialogs, one step above the water.
- **Sea Fog** (`fg`): Headlines, card titles, primary text, the hero mark's line work.
- **Weathered Grey** (`mid`): Body copy, secondary labels, counters. 5.1:1 on slate, the minimum for anything a visitor needs to read.
- **Hull Grey** (`dim`): Decorative only (inactive marks, backgrounds of backgrounds). Never for information: it fails AA.
- **Hairline** (`rule`, 9% fog): Section dividers and form underlines.
- **Soft Hairline** (`rule-soft`, 6% fog): Card edges at rest.
- **Gold Hairline** (`rule-accent`, 22% gold): Tag borders, the care card's edge, the care list divider.

### Named Rules
**The One Lamp Rule.** Gold appears as a line, a word or a small chip, never as a panel or button fill. The two filled "Monthly" badges are the only exception.

**The Legible Grey Rule.** Anything a visitor must read uses `mid` or brighter. `dim` is decoration.

**The Warm Water Rule.** Background and surface stay warm navy. If a screen reads as "generic dark mode", the navy has gone too cool or too black.

## 3. Typography

**Display Font:** Lora (with Georgia, serif)
**Body Font:** Figtree (with system-ui, sans-serif)

**Character:** A bookish serif with a steady hand, paired with a friendly humanist sans. Lora carries weight and warmth; Figtree keeps everything functional and quiet. Only four Lora cuts load: 500, 600, 700 and italic 500.

### Hierarchy
- **Display** (Lora 500, `clamp(40px, 6vw, 70px)`, 1.08): The hero `<h1>` only. One word may be set in italic 500 gold with a drawn underline.
- **Headline** (Lora 500, `clamp(30px, 4vw, 52px)`, 1.12): Section openers: About, Process, Principles, Services, Contact.
- **Title** (Lora 600, `clamp(1.8rem, 3vw, 2.8rem)`, 1): Service panel titles.
- **Card Title** (Lora 600, 1.25–1.3rem, 1.2): Process and principle card titles.
- **Numeral** (Lora 700, 3.5rem, 1): The ghost step numbers on process cards.
- **Body** (Figtree 400, 1rem, 1.7): Running copy, set in Weathered Grey, 45–75ch per line.
- **Body Small** (Figtree 400, 0.9rem, 1.8): Card copy.
- **Label** (Figtree 500–600, 0.7–0.85rem, uppercase, 0.05–0.2em tracking): Nav, kickers, tags, badges, form labels, CTA text.

### Named Rules
**The Serif-For-Weight Rule.** Lora appears only where a line needs authority: headlines, card titles, numerals, the Build Finder's question and result. Never in labels or running body copy.

**The Label Floor Rule.** No text below 0.7rem (11.2px). Uppercase, wide-tracked labels read smaller than their size, so the floor is non-negotiable, including badges.

**The Plain Punctuation Rule.** No em dashes in copy. Use commas, colons, parentheses or full stops.

## 4. Elevation

Layered. Depth exists at rest, and one more step appears on intent. At rest: a fixed grain texture (SVG noise at 7%) sits over the whole page; the hero carries a large m/d mark at about 5.5% opacity whose dotted ring turns once every two minutes; cards are Harbour Slate with a Soft Hairline edge. On hover, cards rise: a soft shadow, a gold-tinted edge, and a few pixels of lift. Dialogs float over a dimmed, lightly blurred page.

### Shadow Vocabulary
- **Process lift** (`box-shadow: 0 12px 40px rgba(0,0,0,.28)`): Process cards on hover, with `scale(1.025)` and a 14% gold edge; the ghost numeral brightens to 85% gold.
- **Principle lift** (`box-shadow: 0 16px 44px rgba(0,0,0,.3)`): Principle cards on hover, with `translateY(-6px)` and a 20% gold edge (40% on the care card); the icon brightens and rises, and the tag gains a faint gold fill.
- **Dialog backdrop** (`rgba(14,18,24,.72)` with `blur(4px)`): Behind modal dialogs only.

### Named Rules
**The Lift On Intent Rule.** Nothing moves until it's reached for. Hover lifts live inside `@media (hover:hover)` so a tap on a phone never leaves a card stuck mid-air; touch devices get the resting state, with anything the hover would have revealed (such as the step numerals at 46% gold) shown by default.

**The Transform Handoff Rule.** GSAP entrance tweens must end with `clearProps: 'transform,translate,rotate,scale'`. GSAP writes inline transforms (and, since 3.12, inline `translate/scale: none`), which silently block every CSS hover transform.

**The Compositor Rule.** Animate only `transform` and `opacity`. Underlines scale on `scaleX`, the tab indicator moves with `x` and `scaleX`, the hero ring spins as its own layer. Never animate width, left or margins.

## 5. Components

### Outlined Buttons (primary CTAs only)
- **Use:** The hero, services and form-submit "Start a project" actions. Everything else stays a text link.
- **Shape:** Text-link styling (`.link-cta` / `.form-submit`) plus `.btn-outline`: 1px gold border, `.9rem 1.5rem` padding, square corners, no underline.
- **Hover:** Background tints to 8% gold (`rgba(242,201,76,.08)`); the arrow still nudges 3px right. Never a solid fill.

### Text Links
- **Shape:** No chrome. Gold uppercase label text with an arrow.
- **Hover:** A 2px gold underline draws in from the left (`scaleX` 0→1, 0.3s, `cubic-bezier(.25,1,.5,1)`); the arrow nudges 3px right.
- **Touch:** An invisible 14px hit box extends every small link to at least 44px on coarse pointers, without changing layout.
- **Disabled:** 35% opacity, no underline.

### Cards
- **Corner Style:** 28px.
- **Background:** Harbour Slate with a Soft Hairline edge; the care card adds a 135° gold wash and a Gold Hairline edge.
- **Padding:** 2.5rem.
- **Hover:** See Elevation. Process cards scale; principle cards rise.
- **Variety:** Principle cards form a bento (tall, two stacked, one full-width), never an identical grid.

### Tags & Badges
- **Outline tag:** Transparent, 1px Gold Hairline, gold label text. Gains an 8% gold fill on its card's hover.
- **Filled badge:** Solid gold, Dusk Water text. Reserved for "Monthly".

### Inputs / Fields
- **Style:** Transparent, a single Hairline underline, no box.
- **Label:** Floats from inside the field to above it on focus or once filled (0.74rem → 0.7rem, Weathered Grey → Sea Fog).
- **Focus:** The underline turns gold. A global 2px gold `:focus-visible` outline covers everything else.

### Choice Options (Build Finder)
- **Style:** 14px-rounded rows with a Hairline edge; a hollow ring (radio) or rounded square (checkbox) marker.
- **Selected:** Gold edge, 6% gold fill, filled gold marker.
- **Keyboard:** Real radio and checkbox inputs underneath; focus draws the gold outline around the whole row.

### Navigation
- **Style:** Static header on the water. Label-role links in Sea Fog, each with a standing 2px gold underline; Portal stays unlined until hover.
- **Logo:** The mann/dev wordmark at 20px tall, cropped to its ink so it aligns with the gutter.
- **Mobile:** Process hides below 600px; links stay on one line.

### Hero Mark (signature)
The m/d monogram, redrawn as an outlined SVG at up to 560px: the dotted ring on its own layer, turning slowly; the letters as a 1.6px stroke. Sits in the hero's right half at about 5.5% Sea Fog, fully in frame, behind the text. Still under reduced motion.

### Service Visual (signature)
Small panels with a traffic-light dot row over an abstract wireframe (nav rail, content lines, a CTA block, a node-and-flow diagram). They imply "this is what gets built" without faking code.

## 6. Do's and Don'ts

### Do:
- **Do** keep every action a gold text link with a drawn underline and arrow (The One Lamp Rule).
- **Do** keep the water warm navy (`#1e2530`) and the hull slate (`#252b34`).
- **Do** use Lora only for headlines, card titles, numerals and Build Finder questions and results.
- **Do** keep every readable word at `mid` (5.1:1) or brighter, and every label at 0.7rem or larger.
- **Do** put hover lifts in `@media (hover:hover)` and extend small tap targets to 44px on touch.
- **Do** end GSAP entrance tweens with `clearProps` so CSS hovers can work.
- **Do** animate with `transform` and `opacity` only, and respect `prefers-reduced-motion`.
- **Do** keep the principle cards a bento, not a uniform grid.

### Don't:
- **Don't** build anything resembling "generic SaaS landing pages (bright gradients, hero-metric blocks, stock illustrations)".
- **Don't** drift toward "bloated agency sites with layers of process jargon and team photos".
- **Don't** ship "anything that reads as templated". "No templates" is a core claim the design must visually back up.
- **Don't** add a filled button anywhere; gold fills are for the "Monthly" badges only. Primary CTAs are outlined, not filled.
- **Don't** use `dim` (`#636872`) for information: it fails contrast.
- **Don't** use gradient text, glass cards, or coloured side stripes thicker than 1px.
- **Don't** use em dashes in copy.
- **Don't** animate `width`, `left`, `top` or margins.
- **Don't** fabricate client testimonials or social proof. Real, attributed testimonials come from Julien directly.
