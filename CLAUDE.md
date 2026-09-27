# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

URLPurifier strips the tracking values that ride along with a URL and shows what was removed and why. Part of the "生成AIで作るセキュリティツール100" project (Day 039). Everything runs in the browser; nothing is sent to a server.

Live demo: https://ipusiron.github.io/urlpurifier/

## Architecture

A static page built from plain scripts (no modules, no bundler, no dependencies), so it also works over `file://`.

```
index.html   # Markup; display text is bound to the dictionary via data-i18n
style.css    # Styles, including the light/dark variables
i18n.js      # MESSAGES (ja/en) and the I18n class. Loaded before script.js
script.js    # URL parsing, removal rules, the notices, and the screen updates
```

`script.js` has three layers: the rule tables at the top, the pure functions (`parseInputUrl`, `cleanOne`, `cleanBatch`, `analyzeRisks`), and `setupUI()` which wires the DOM. The tests load the file through `new Function` and exercise the pure functions, so nothing above `setupUI()` may touch `document` at load time.

## Rules that the tests enforce

`npm test` (Node 22, `node --test`, no dependencies) fails if any of these are broken. Each one exists because the corresponding defect was found here.

**1. Only `http` and `https` come out.**
`ALLOWED_PROTOCOLS` is the gate. `javascript:`, `data:`, `vbscript:`, `file:` and `ftp:` used to be emitted verbatim as "cleaned URLs", which is dangerous for a tool whose output is meant to be pasted. Rejected lines are returned with an error code and rendered with a leading `#` so they cannot be mistaken for a URL.

**2. Never invent a URL.**
`looksLikeHost()` is anchored at both ends and requires a last label of two or more characters. The earlier pattern had no end anchor and every group optional, so `hello world` became `https://hello%20world/`.

**3. Removal rules are data, not conditionals.**
The common blocks, the strict list, the Amazon list and `SITE_PARAM_RULES` all feed one `Set`. A per-site rule applies only on that host: `t=` is dropped on X but kept on YouTube, where it is the playback position. Do not add a name to the common list if it carries meaning anywhere.

**4. Every removed value carries an explanation.**
`stripParams()` and `stripFragment()` return `{name, where, noteKey}`. `noteKeyFor()` must resolve to a key that exists in both dictionaries; the tests check this.

**5. Never build HTML strings out of input.**
URLs, parameter names and host names go through `createElement` and `textContent`. They must not reach `innerHTML` or an attribute string.

**6. No inline handlers and no `style` attributes.**
A `style="..."` attribute in the markup, or `setAttribute("style", ...)`, is blocked by `style-src` and produced a real `style-src-attr` violation here. Writing through the CSSOM (`element.style.display = ...`) is *not* blocked — that was measured in both directions. Show and hide through the `hidden` attribute anyway, because it keeps the state in one place and reads better than scattering display values; use the CSSOM only for geometry that has to be computed.

**7. No external resources or network calls.**
No CDN, font, API or analytics. `connect-src 'none'` stays.

**8. Display text lives in `i18n.js`.**
`script.js` calls `uiText(key)`. The `ja` and `en` tables must have identical keys and identical `{placeholder}` names.

**9. Storage access is always wrapped.**
Only the theme and the language are stored, and both reads and writes sit in `try`/`catch`. A browser that refuses storage must still run every feature. Do not store the URLs the user types; the README and the help both promise that.

## Language handling

Order: `?lang=ja|en` → the saved setting → `navigator.language`. Switching reloads the page and carries the input and the result in `window.name`, never in storage.

## Running it

```bash
start index.html          # Windows, direct open
python -m http.server 8000
npm test
```

## Deliberate exceptions

- `document.execCommand("copy")` remains as a fallback for environments without the async clipboard. When it fails the user is told to copy by hand instead of being left with a silent no-op.
- The checkbox inputs are 18px; the label wrapping each one is 44px, which is the actual hit area.
- Screenshots are produced by `D:\ipusiron-work\business\research\try100_audit\impl\shots\day039_shots.py`, which lives outside this repository.
