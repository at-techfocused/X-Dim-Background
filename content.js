/**
 * X Dim Background — Content Script v1.3.0
 *
 * Restores the Dim (dark blue) background to X/Twitter.
 *
 * @author @TechFocused (x.com/TechFocused)
 * @license MIT
 * @see https://github.com/TechFocused/x-dim-background
 *
 * Architecture:
 *   1. Single <style> injection with CSS class + attribute overrides (~95%)
 *   2. One MutationObserver: re-injects style, fixes new inline-styled nodes,
 *      detects SPA navigation, and injects the Dim settings button
 *   3. All work batched via requestAnimationFrame — zero polling
 *
 * DIM palette:
 *   #15202B  Primary background
 *   #1E2732  Elevated surfaces (cards, hover, widgets)
 *   #263340  Tertiary (inputs, active states)
 *   #38444D  Borders, dividers
 *   #8B98A5  Secondary text
 *   #F7F9F9  Primary text
 *   #1D9BF0  Accent blue
 */

"use strict";

const STYLE_ID = "x-dim-background";
const DIM_BTN_ID = "x-dim-bg-btn";

let isEnabled = false;

// ── 1. DIM CSS ──────────────────────────────────────────────────────

const DIM_CSS = `
  :root[data-theme="dark"] {
    --background: 215, 29%, 13%;
    --border: 206, 16%, 26%;
  }
  :root {
    --dim-bg: rgb(21, 32, 43);
    --dim-elevated: rgb(30, 39, 50);
    --dim-tertiary: rgb(38, 51, 64);
    --dim-backdrop: rgba(21, 32, 43, 0.85);
    --dim-text-secondary: rgb(139, 152, 165);
    --dim-border: rgb(56, 68, 77);
  }

  /* Base */
  html, body {
    background-color: var(--dim-bg) !important;
    color-scheme: dark !important;
  }
  body[style*="background-color: rgb(0, 0, 0)"] {
    background-color: var(--dim-bg) !important;
  }

  /* Atomic class overrides (Lights Out → DIM) */
  .r-kemksi { background-color: var(--dim-bg) !important; }
  .r-5zmot { background-color: var(--dim-backdrop) !important; }
  .r-1shrkeu, .r-gu4em3 { background-color: var(--dim-border) !important; }
  .r-1hdo0pc, .r-g2wdr4 { background-color: var(--dim-elevated) !important; }
  .r-1kqtdi0, .r-1igl3o0, .r-2sztyj, .r-1roi411 { border-color: var(--dim-border) !important; }
  .r-1bwzh9t { color: var(--dim-text-secondary) !important; }

  /* Compose & reply text visibility */
  [data-testid^="tweetTextarea"] [contenteditable],
  [data-testid^="tweetTextarea"] [role="textbox"],
  [data-testid="primaryColumn"] [contenteditable="true"] {
    color: #F7F9F9 !important;
    -webkit-text-fill-color: #F7F9F9 !important;
    caret-color: #1D9BF0 !important;
  }
  .draftjs-styles_0 .public-DraftEditorPlaceholder-root,
  [data-testid^="tweetTextarea"] [data-placeholder],
  input::placeholder {
    color: var(--dim-text-secondary) !important;
    -webkit-text-fill-color: var(--dim-text-secondary) !important;
  }

  /* Lights Out secondary text color → DIM */
  [style*="color: rgb(113, 118, 123)"] {
    color: var(--dim-text-secondary) !important;
  }

  /* Inline style combos */
  [style*="background-color: rgb(0, 0, 0)"][style*="border-color: rgb(47, 51, 54)"],
  [style*="border-color: rgb(47, 51, 54)"][style*="background-color: rgb(0, 0, 0)"] {
    background-color: var(--dim-bg) !important;
  }
  [style*="border-color: rgb(47, 51, 54)"].r-1che71a {
    background-color: var(--dim-elevated) !important;
  }

  /* Catch-all: inline black backgrounds */
  *[style*="background-color: rgb(0, 0, 0)"],
  *[style*="background-color:#000000"],
  *[style*="background-color:#000"],
  *[style*="background: rgb(0, 0, 0)"] {
    background-color: var(--dim-bg) !important;
  }

  /* Lights Out elevated surfaces → DIM elevated */
  *[style*="background-color: rgb(16, 16, 16)"],
  *[style*="background-color: rgb(22, 24, 28)"],
  *[style*="background-color: rgb(25, 25, 25)"],
  *[style*="background-color: rgb(32, 35, 39)"] {
    background-color: var(--dim-elevated) !important;
  }

  /* Border overrides */
  *[style*="border-color: rgb(47, 51, 54)"],
  *[style*="border-color: rgb(51, 54, 57)"] {
    border-color: var(--dim-border) !important;
  }

  /* Sidebar widgets */
  [data-testid="sidebarColumn"] section,
  aside[role="complementary"] {
    background-color: var(--dim-elevated) !important;
    border-radius: 16px !important;
  }

  /* Search bar */
  [data-testid="SearchBox_Search_Input"] {
    background-color: transparent !important;
  }

  /* Modals & dialogs */
  [role="dialog"] > div > div,
  div[aria-modal="true"] > div {
    background-color: var(--dim-bg) !important;
  }

  /* Grok */
  div[data-testid="GrokDrawer"] [role="textbox"],
  div[data-testid="GrokDrawer"] textarea {
    background-color: var(--dim-tertiary) !important;
    border-color: var(--dim-border) !important;
    color: #F7F9F9 !important;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: var(--dim-bg); }
  ::-webkit-scrollbar-thumb { background: var(--dim-border); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--dim-text-secondary); }
`;

// ── 2. Apply / Remove ───────────────────────────────────────────────

function applyDim() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = DIM_CSS;
  (document.head || document.documentElement).appendChild(s);
}

function removeDim() {
  document.getElementById(STYLE_ID)?.remove();
}

// ── 3. State ────────────────────────────────────────────────────────

function setEnabled(value) {
  if (isEnabled === value) return;
  isEnabled = value;
  chrome.storage.local.set({ enabled: value });
  value ? applyDim() : removeDim();
}

// ── 4. Inline background fixer ──────────────────────────────────────

const BG_MAP = {
  "rgb(0,0,0)":     "#15202B",
  "rgba(0,0,0,1)":  "#15202B",
  "rgb(16,16,16)":  "#1E2732",
  "rgb(22,24,28)":  "#1E2732",
  "rgb(25,25,25)":  "#1E2732",
  "rgb(32,35,39)":  "#1E2732",
};

function fixElement(el) {
  const bg = el.style?.backgroundColor;
  if (!bg) return;
  const mapped = BG_MAP[bg.replace(/\s/g, "")];
  if (mapped) el.style.setProperty("background-color", mapped, "important");
}

function fixTree(root) {
  fixElement(root);
  const styled = root.querySelectorAll?.('[style*="background"]');
  if (styled) for (const el of styled) fixElement(el);
}

// ── 5. Display Settings UI ──────────────────────────────────────────

const CHECK_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true" class="r-4qtqp9 r-yyyyoo r-dnmrzs r-bnwqim r-lrvibr r-m6rgpd r-jwli3a r-1hjwoze r-12ym1je"><g><path d="M9.64 18.952l-5.55-4.861 1.317-1.504 3.951 3.459 8.459-10.948L19.4 6.32 9.64 18.952z"></path></g></svg>`;

function setRadioState(btn, on) {
  btn.style.borderColor = on ? "rgb(29, 155, 240)" : "rgb(51, 54, 57)";
  btn.style.borderWidth = on ? "2px" : "1px";
  const circle = btn.querySelector('[role="radio"] > div');
  if (circle) {
    circle.style.backgroundColor = on ? "rgb(29, 155, 240)" : "rgba(0,0,0,0)";
    circle.style.borderColor = on ? "rgb(29, 155, 240)" : "rgb(185, 202, 211)";
    circle.innerHTML = on ? CHECK_SVG : "";
  }
  const input = btn.querySelector('input[type="radio"]');
  if (input) input.checked = on;
}

function tryInjectDimOption() {
  if (document.getElementById(DIM_BTN_ID)) return;

  const group = document.querySelector('[aria-label="Background options"][role="radiogroup"]');
  if (!group) return;

  const buttons = group.querySelectorAll(":scope > div");
  if (buttons.length < 2) return;

  const [defaultBtn, lightsOutBtn] = buttons;
  const dimBtn = lightsOutBtn.cloneNode(true);
  dimBtn.id = DIM_BTN_ID;
  dimBtn.style.backgroundColor = "rgb(21, 32, 43)";

  const label = dimBtn.querySelector("span");
  if (label) label.textContent = "Dim";

  const radio = dimBtn.querySelector('input[type="radio"]');
  if (radio) { radio.setAttribute("aria-label", "Dim"); radio.checked = false; }

  setRadioState(dimBtn, isEnabled);
  if (isEnabled) setRadioState(lightsOutBtn, false);

  group.insertBefore(dimBtn, lightsOutBtn);

  let switching = false;

  dimBtn.addEventListener("click", () => {
    switching = true;
    const lo = lightsOutBtn.querySelector('input[type="radio"]');
    if (lo && !lo.checked) {
      lo.click();
      lo.dispatchEvent(new Event("input", { bubbles: true }));
      lo.dispatchEvent(new Event("change", { bubbles: true }));
    }
    setTimeout(() => {
      setEnabled(true);
      setRadioState(dimBtn, true);
      setRadioState(defaultBtn, false);
      setRadioState(lightsOutBtn, false);
      switching = false;
    }, 300);
  });

  for (const btn of [defaultBtn, lightsOutBtn]) {
    btn.addEventListener("click", () => {
      if (switching) return;
      setEnabled(false);
      setRadioState(dimBtn, false);
    });
  }
}

// ── 6. Single Observer ──────────────────────────────────────────────
// Handles: style re-injection, inline bg fixes, SPA nav, settings UI

let observer;
let rafPending = false;
let pendingNodes = [];
let lastPath = location.pathname;

function flush() {
  rafPending = false;
  if (!isEnabled) return;

  // Style re-injection guard
  if (!document.getElementById(STYLE_ID)) applyDim();

  // Fix new nodes
  for (let i = 0, len = pendingNodes.length; i < len; i++) {
    fixTree(pendingNodes[i]);
  }
  pendingNodes.length = 0;

  // SPA navigation detection
  const path = location.pathname;
  if (path !== lastPath) {
    lastPath = path;
    if (path.includes("/settings")) setTimeout(tryInjectDimOption, 300);
  }

  // Settings page check (also needed on initial load, not just nav)
  if (path.includes("/settings")) tryInjectDimOption();
}

function startObserver() {
  if (observer) return;
  observer = new MutationObserver((mutations) => {
    try {
      for (let i = 0, mLen = mutations.length; i < mLen; i++) {
        const added = mutations[i].addedNodes;
        for (let j = 0, aLen = added.length; j < aLen; j++) {
          if (added[j].nodeType === 1) pendingNodes.push(added[j]);
        }
      }
      if (!rafPending && pendingNodes.length > 0) {
        rafPending = true;
        requestAnimationFrame(flush);
      }
    } catch {
      observer?.disconnect();
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

// ── 7. Init ─────────────────────────────────────────────────────────

chrome.storage.local.get("enabled", ({ enabled }) => {
  // Auto-enable on first install
  isEnabled = enabled === undefined ? true : !!enabled;
  if (enabled === undefined) chrome.storage.local.set({ enabled: true });

  if (isEnabled) applyDim();
  startObserver();
});

chrome.storage.onChanged.addListener((changes) => {
  if (!changes.enabled) return;
  isEnabled = !!changes.enabled.newValue;
  isEnabled ? applyDim() : removeDim();
});
