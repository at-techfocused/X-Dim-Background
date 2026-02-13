# Publishing Guide

Step-by-step instructions for publishing X Dim Background to GitHub and the Chrome Web Store.

---

## Part 1: GitHub (Open Source)

### 1. Create a GitHub repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `x-dim-background`
3. Description: `Chrome extension that restores the Dim (dark blue) theme to X/Twitter`
4. Set to **Public**
5. Don't initialize with README (we already have one)
6. Click **Create repository**

### 2. Push the code

```bash
cd x-dim-background
git init
git add .
git commit -m "Initial release v1.1.0"
git branch -M main
git remote add origin https://github.com/TechFocused/x-dim-background.git
git push -u origin main
```

### 3. Create a release

1. Go to your repo → **Releases** → **Create a new release**
2. Tag: `v1.1.0`
3. Title: `v1.1.0 — Initial Release`
4. Description: paste the key features from the README
5. Attach the `.zip` file as a binary
6. Click **Publish release**

---

## Part 2: Chrome Web Store

### Prerequisites

- A Google account
- $5 USD one-time developer registration fee
- Screenshots of the extension in action (1280×800 or 640×400)
- A 128×128 icon (already included)

### 1. Register as a Chrome Web Store Developer

1. Go to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Sign in with your Google account
3. Agree to the developer agreement
4. Pay the one-time **$5 registration fee**
5. Fill in your publisher details:
   - **Publisher name**: Your name or handle
   - **Email**: A contact email (publicly visible)

### 2. Prepare the Store Listing

You'll need these assets:

| Asset | Spec | Notes |
|-------|------|-------|
| Extension ZIP | The repo zipped (without `.git/`) | Exclude `.git`, `README.md`, `PRIVACY.md`, `PUBLISHING.md` |
| Store icon | 128×128 px PNG | Already in `icons/icon128.png` |
| Screenshot(s) | 1280×800 or 640×400 PNG | Take screenshots showing the Dim theme on X |
| Small promo tile | 440×280 PNG | Optional but recommended |

**Create a clean ZIP for the store** (only the extension files):

```bash
zip -r x-dim-background-store.zip manifest.json content.js popup.html popup.js icons/
```

### 3. Upload to Chrome Web Store

1. In the Developer Dashboard, click **Add new item**
2. Upload your `x-dim-background-store.zip`
3. Fill in the **Store Listing**:
   - **Name**: X Dim Background
   - **Summary**: Restores the Dim (dark blue) background to X/Twitter
   - **Description**:
     ```
     X/Twitter removed the Dim theme in February 2026. This extension brings it back.

     Features:
     • Restores the original Dim (dark blue) theme (#15202B)
     • Adds a "Dim" button back to X's Display Settings
     • Toggle on/off from the extension popup
     • Lightweight — just CSS overrides, no heavy scripts
     • Zero data collection — fully open source

     Only runs on x.com and twitter.com. No data is collected.
     Source code: https://github.com/TechFocused/x-dim-background
     ```
   - **Category**: Accessibility (or Appearance)
   - **Language**: English

4. Upload your screenshot(s)

5. Fill in the **Privacy** tab:
   - **Single purpose**: "Restores the Dim background theme to X/Twitter"
   - **Permissions justification**:
     - `storage`: "Stores a single boolean to remember the user's on/off preference"
     - Host permissions: "Injects theme CSS on x.com and twitter.com only"
   - **Data usage**: Check "I do not collect or use data"
   - **Privacy policy URL**: Link to your `PRIVACY.md` on GitHub:
     `https://github.com/TechFocused/x-dim-background/blob/main/PRIVACY.md`

6. Fill in the **Distribution** tab:
   - **Visibility**: Public
   - **Markets**: All regions

### 4. Submit for Review

1. Click **Submit for Review**
2. Optionally uncheck "Publish automatically" if you want to control timing
3. Reviews typically take **1–3 business days**

### 5. After Publishing

- Update the README badge with your Chrome Web Store link
- Share the store listing URL on X/Twitter
- Monitor reviews for feedback
- If X changes their CSS classes, update `content.js` and publish a new version

---

## Updating the Extension

1. Bump `version` in `manifest.json` (e.g., `1.1.0` → `1.1.1`)
2. Zip the updated files
3. Go to Developer Dashboard → your extension → **Package** tab
4. Click **Upload new package**
5. Submit for review

---

## Tips

- **Screenshots sell**: Take clean screenshots of the Dim theme on the home feed, a tweet detail page, and the settings UI with the restored Dim button.
- **Respond to reviews**: Chrome Web Store lets you reply to user reviews — this builds trust.
- **Link to GitHub**: Prominently link the source code in the description to show transparency.
