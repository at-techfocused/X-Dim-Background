# X Dim Background

A lightweight Chrome extension that restores the **Dim** (dark blue) background theme to X/Twitter after it was removed in February 2026.

![License](https://img.shields.io/badge/License-MIT-green)
![Manifest](https://img.shields.io/badge/Manifest-V3-orange)
![Size](https://img.shields.io/badge/Size-~15KB-blue)

---

## Why?

In February 2026, X/Twitter removed the Dim theme option, leaving users with only **Default** (white) and **Lights Out** (pure black). Many users preferred the Dim theme's navy blue (`#15202B`) — it's easier on the eyes, especially for those with astigmatism, where pure black on OLED screens causes halation (white text appears to smear).

This extension brings it back.

## Features

- **Restores the original Dim color palette** — backgrounds, borders, and text colors matched to the real Dim theme
- **Adds a "Dim" button back into X's Display Settings** — toggle natively from Settings → Display
- **Auto-enables on install** — no setup needed
- **Lightweight** — single `<style>` injection, one observer, zero polling
- **Compose box fix** — text in tweet/reply boxes stays visible
- **Grok page support** — Dim theme applies to the Grok chat interface
- **Zero data collection** — fully open source, read every line

## Install

### Chrome Web Store
> Coming soon — pending review.

### Manual Install

1. Download or clone this repository
2. Open Chrome → `chrome://extensions/`
3. Enable **Developer mode** (toggle, top-right)
4. Click **Load unpacked** → select the repo folder
5. Visit x.com — the Dim theme is applied automatically

## How It Works

The extension targets X's **atomic CSS classes** (like `.r-kemksi` for black backgrounds) and remaps them to Dim colors via a single injected `<style>` tag. This handles ~95% of elements with zero JavaScript cost.

For the remaining edge cases (inline styles set by React), CSS attribute selectors catch the override. A single `MutationObserver` watches for new DOM nodes and fixes inline black backgrounds on insertion — no polling, no `getComputedStyle` scans, all work batched via `requestAnimationFrame`.

### Performance

- **One observer** — handles style re-injection, inline fixes, SPA navigation, and settings UI injection
- **No `setInterval` / `setTimeout` polling**
- **`requestAnimationFrame` batching** — mutations coalesced to one paint cycle
- **Cached state** — enabled flag in memory, no `chrome.storage` reads per mutation
- **Settings injection gated by URL** — `tryInjectDimOption()` only runs on `/settings` pages

## DIM Color Palette

| Role | Hex | RGB |
|------|-----|-----|
| Primary background | `#15202B` | `rgb(21, 32, 43)` |
| Elevated surfaces | `#1E2732` | `rgb(30, 39, 50)` |
| Tertiary / inputs | `#263340` | `rgb(38, 51, 64)` |
| Borders | `#38444D` | `rgb(56, 68, 77)` |
| Secondary text | `#8B98A5` | `rgb(139, 152, 165)` |
| Primary text | `#F7F9F9` | — |
| Accent blue | `#1D9BF0` | `rgb(29, 155, 240)` |

## File Structure

```
x-dim-background/
├── manifest.json     # Manifest V3
├── content.js        # CSS injection + settings UI + observer
├── popup.html        # Toggle popup
├── popup.js          # Toggle logic
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── README.md
├── LICENSE
├── PRIVACY.md
└── PUBLISHING.md
```

## Privacy

Zero user data collected. Uses `chrome.storage.local` only to remember your on/off preference. No network requests, no analytics, no tracking. See [PRIVACY.md](PRIVACY.md).

## Contributing

X/Twitter occasionally changes their CSS class names — if the extension breaks, PRs updating the class mappings in `content.js` are welcome.

1. Fork the repo
2. Create a branch (`git checkout -b fix/updated-classes`)
3. Test locally via `chrome://extensions/` → Load unpacked
4. Submit a PR

## Credits

Created by [@TechFocused](https://x.com/TechFocused).

## License

[MIT](LICENSE)
