# PRAGMA — Brand & Colour System

> "Don't predict. Act."

---

## 1. Identity at a Glance

| Element        | Value                        |
|----------------|------------------------------|
| Product Name   | **PRAGMA**                   |
| Tagline        | Don't predict. Act.          |
| Visual Tone    | Precision · Autonomous · Sharp |
| Theme Support  | Dark (default) + Light       |

---

## 2. Colour Palette

Three colours. That's it. The brand lives entirely inside black, white, and one blue.

### Primary Colours

| Role            | Name           | Hex       | Use                                      |
|-----------------|----------------|-----------|------------------------------------------|
| Background      | Black          | `#000000` | Page bg, panel bg (dark mode)            |
| Text / Contrast | White          | `#FFFFFF` | All text, icons, borders (dark mode)     |
| Accent          | Electric Blue  | `#2563EB` | Buttons, active states, links, agent pulse, highlights |

### Surface Shades (derived — not extra colours, just tones)

| Role            | Hex       | Use                                   |
|-----------------|-----------|---------------------------------------|
| Card / Panel    | `#0A0A0A` | Subtle card bg separation (dark mode) |
| Border          | `#1A1A1A` | Card borders, dividers (dark mode)    |
| Card / Panel    | `#F5F5F5` | Subtle card bg separation (light mode)|
| Border          | `#E5E5E5` | Card borders, dividers (light mode)   |
| Muted Text      | `#6B7280` | Labels, secondary info (both modes)   |
| Blue Hover      | `#1D4ED8` | Button/link hover state (both modes)  |

### Functional Colours (not brand — data only)

| Role    | Hex       | Use                              |
|---------|-----------|----------------------------------|
| Profit  | `#22C55E` | Positive P&L, success states     |
| Loss    | `#EF4444` | Negative P&L, error states       |

> These appear only on numbers and status indicators — never in brand contexts like logos, headers, or buttons.

---

## 3. Theme System

PRAGMA ships with **two themes**. The same 3 colours run both — only the background and text roles swap.

### Dark Mode (Default)
```
Background:   #000000   ← black
Card:         #0A0A0A   ← off-black
Border:       #1A1A1A   ← dark divider
Text:         #FFFFFF   ← white
Muted Text:   #6B7280   ← grey
Accent Blue:  #2563EB   ← unchanged
```

### Light Mode
```
Background:   #FFFFFF   ← white
Card:         #F5F5F5   ← off-white
Border:       #E5E5E5   ← light divider
Text:         #000000   ← black
Muted Text:   #6B7280   ← grey
Accent Blue:  #2563EB   ← unchanged
```

> Blue is the one constant. It never changes between themes — it is the anchor of the brand.

---

## 4. Typography

One font family, two roles.

| Role                   | Family          | Weight | Use                                      |
|------------------------|-----------------|--------|------------------------------------------|
| Display / Headings     | **Space Grotesk** | 700    | Page titles, section headers, hero text  |
| Body / Data / UI       | **Inter**       | 400 / 500 | Paragraphs, labels, table values, P&L numbers |

Both are available free on Google Fonts.

```css
/* Google Fonts import */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&family=Inter:wght@400;500&display=swap');
```

### Type Scale

| Token        | Size    | Weight | Family        | Use                    |
|--------------|---------|--------|---------------|------------------------|
| `display`    | 48px    | 700    | Space Grotesk | Hero / landing heading |
| `heading-lg` | 32px    | 700    | Space Grotesk | Page section title     |
| `heading-md` | 24px    | 700    | Space Grotesk | Card title             |
| `heading-sm` | 18px    | 500    | Inter         | Sub-section label      |
| `body`       | 16px    | 400    | Inter         | Standard body text     |
| `label`      | 13px    | 500    | Inter         | UI labels, tags        |
| `mono-data`  | 14px    | 500    | Inter (tabular)| P&L numbers, prices   |

> For all numeric data (prices, P&L, percentages) use `font-variant-numeric: tabular-nums` so digits align cleanly in columns.

---

## 5. Tailwind CSS Tokens

Add these to your `tailwind.config.ts` under `theme.extend`:

```ts
colors: {
  brand: {
    black:  '#000000',
    white:  '#FFFFFF',
    blue:   '#2563EB',
    'blue-hover': '#1D4ED8',
  },
  surface: {
    dark:   '#0A0A0A',
    light:  '#F5F5F5',
  },
  border: {
    dark:   '#1A1A1A',
    light:  '#E5E5E5',
  },
  muted:    '#6B7280',
  profit:   '#22C55E',
  loss:     '#EF4444',
},
fontFamily: {
  display: ['Space Grotesk', 'sans-serif'],
  body:    ['Inter', 'sans-serif'],
},
```

---

## 6. CSS Custom Properties

Wire both themes via CSS variables in `globals.css`:

```css
/* Dark mode (default) */
:root {
  --bg:         #000000;
  --bg-card:    #0A0A0A;
  --border:     #1A1A1A;
  --text:       #FFFFFF;
  --text-muted: #6B7280;
  --accent:     #2563EB;
  --accent-hover: #1D4ED8;
  --profit:     #22C55E;
  --loss:       #EF4444;
}

/* Light mode */
@media (prefers-color-scheme: light) {
  :root {
    --bg:         #FFFFFF;
    --bg-card:    #F5F5F5;
    --border:     #E5E5E5;
    --text:       #000000;
    --text-muted: #6B7280;
    --accent:     #2563EB;
    --accent-hover: #1D4ED8;
  }
}
```

---

## 7. Usage Rules

1. **Blue is the only interactive colour.** Every clickable element — button, link, toggle — uses `#2563EB`. Nothing else.
2. **Never use blue for text blocks.** Blue on black or white is for interactive UI elements only, not decorative headings.
3. **Muted text is grey, not blue.** Secondary labels use `#6B7280` — not a dimmed blue.
4. **Green and red are data, not branding.** They appear only in P&L rows, trade status badges, and error messages.
5. **One blue pop per view.** Don't stack multiple blue elements fighting for attention. Lead with one hero action (e.g. Activate Agent button).

---

## 8. Voice & Tone (Brand Personality)

| Attribute     | What it means for PRAGMA                                |
|---------------|---------------------------------------------------------|
| **Precise**   | Numbers are exact. Copy is short and factual.           |
| **Confident** | No hedging. The agent acts — the interface reflects that.|
| **Minimal**   | Every extra element is a distraction. Cut it.           |
| **Trustworthy** | Transparent logs, clear P&L, honest error messages.   |

---

*Stage 4 complete. Next → Stage 5: UI Component Design & Layout.*
