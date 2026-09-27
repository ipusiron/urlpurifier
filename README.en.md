# URLPurifier - clean up your links

English · [日本語](README.md)

![GitHub Repo stars](https://img.shields.io/github/stars/ipusiron/urlpurifier?style=social)
![GitHub forks](https://img.shields.io/github/forks/ipusiron/urlpurifier?style=social)
![GitHub last commit](https://img.shields.io/github/last-commit/ipusiron/urlpurifier)
![GitHub license](https://img.shields.io/github/license/ipusiron/urlpurifier)
[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue?logo=github)](https://ipusiron.github.io/urlpurifier/)

**Day039 - 100 Security Tools with Generative AI**

**URLPurifier** strips the tracking values that ride along with a URL and gives you a short link back.

It does not stop at removing them. It shows you **what was removed and what each value was telling the other end**. It also points out things that are not removed but are worth a look before you paste the link somewhere.

Everything runs in the browser. The URLs you type are never sent anywhere and are not stored.

## 🔗 Demo

👉 **[https://ipusiron.github.io/urlpurifier/](https://ipusiron.github.io/urlpurifier/)**

## 📸 Screenshots

![The breakdown of what was removed](assets/screenshot.png)

*Each removed value, next to what it was telling the destination*

![The English view](assets/en/screenshot.png)

*The English view shows the same thing in English*

## 🎯 What it does

### Removes tracking values

- Always: `utm_*` (where the visit came from), `fbclid`, `gclid`, `dclid`, `msclkid`, `yclid`, `mc_cid`, `_hsenc`, `igshid`, `spm` and similar
- Per site: `si` and `feature` on YouTube, `t` and `s` on X, `igsh` on Instagram, `si` on Spotify, `is_from_webapp` on TikTok, `mibextid` on Facebook
- Thorough mode: `ttclid`, `twclid`, `li_fat_id`, `campaign`, `adgroup`, `ref_src` and similar
- Amazon mode: drops `tag`, `ref`, `psc`, `keywords` and reduces the link to `/dp/ASIN`
- After the `#`: values such as `#utm_source=`, and `#:~:text=` which records the passage you were reading

Several lines are processed at once. `Ctrl+Enter` runs it too.

### Keeps what carries meaning

Values that change the meaning of a link are kept: search terms, article and page numbers, the playback position on YouTube.

**The same name is treated differently per site.** For instance `t=` is a share token on X and gets dropped, while on YouTube it is the playback position and stays. On unrelated sites it is left alone.

### Shows what was removed

Each removed value is listed with what it was telling the other end.

```
What was removed (3)
  utm_source  Records where the visit came from, telling the destination which ad or post you clicked
  utm_medium  Records where the visit came from ...
  fbclid      Facebook's click identifier. It can follow an individual person
```

### Points out what deserves a second look

Six things that are not removed, but are worth knowing about.

| Notice | What is going on |
|---|---|
| A user name is embedded in the URL | In `https://www.google.com@evil.example/`, what comes before the `@` is not the site |
| The host name imitates Latin letters | Cyrillic and similar letters used to look like `apple`. Domains that simply use their own language, such as Japanese ones, are not flagged |
| An unusual port number | Something other than 80 or 443 |
| The connection is not encrypted | Still `http://` |
| A shortened URL | You cannot see where it goes; this tool does not expand it |
| It carries another URL | A parameter contains a second URL, which is how a trusted link gets used as a stepping stone |

## 🌐 Japanese and English

Use the button at the top right. The language is decided in this order:

1. `?lang=ja` or `?lang=en` in the URL
2. The setting you chose last time
3. Your browser's language setting

Switching reloads the page, but **the URLs you typed and the result are kept**. They travel in `window.name`, so no storage is used.

Note that **only your display settings (theme and language) are kept on this device.** The URLs you type are not stored. In a browser that refuses storage, the settings simply do not come back; every feature still works.

## 🔐 How this tool protects itself

A tool that handles URLs has no business breaking on the URLs it handles.

- **Only `http` and `https` are cleaned.** `javascript:` and `data:` are never emitted, because they can run wherever you paste them
- A string that is not a URL never becomes an invented URL
- Input is never assembled into an HTML string. Everything is displayed with `textContent` and `createElement`
- No inline `onclick` and no `style` attributes
- The CSP allows neither `unsafe-inline` nor `unsafe-eval`
- No external CDN, font or API is loaded

The CSP in use:

```
default-src 'none'; script-src 'self'; style-src 'self';
img-src 'self' data:; font-src 'self'; connect-src 'none';
base-uri 'self'; form-action 'self'; object-src 'none';
```

**`frame-ancestors` has no effect in a meta CSP.** Static hosting cannot add arbitrary HTTP headers, so there is no clickjacking defence here. A site that needs to control embedding has to return the header from the server.

## 🧪 Tests

There are no dependencies. Node.js 22 or later is required.

```bash
npm test
```

42 tests check that:

- Schemes such as `javascript:` are never emitted, and invented URLs are never produced
- Per-site rules apply only on those sites
- Meaningful values (search terms, playback position) are kept
- Every removed value has an explanation attached
- The notices appear when they should, and not on ordinary URLs
- No CSP relaxation, `style` attribute, inline handler or network call has crept in
- The dialog is wired correctly and focus is handled
- The Japanese and English dictionaries have the same keys, no empty values and matching placeholders
- No display text is hard-coded inside `script.js`
- The README YAML, heading structure, directory listing and test count match reality

`.github/workflows/test.yml` runs the same tests on every push and pull request.

## 📂 Directory structure

```
urlpurifier/
├── index.html                # Page skeleton; text is bound to the dictionary via data-i18n
├── style.css                 # Styles (light and dark, narrow screens)
├── i18n.js                   # The Japanese and English dictionary, and language handling
├── script.js                 # URL parsing, removal rules, the notices, and the screen updates
├── test/
│   ├── helper.js             # Scaffolding to load the plain scripts from Node
│   ├── url-safety.test.js    # The scheme allow list and URL detection
│   ├── features.test.js      # Per-site rules, the breakdown and the notices
│   ├── markup.test.js        # CSP, markup and accessibility
│   ├── i18n.test.js          # The dictionaries and the absence of hard-coded text
│   ├── idn.test.js           # Punycode decoding and look-alike host detection
│   └── docs.test.js          # Consistency of the README files
├── .github/workflows/test.yml # Runs the tests on push and pull request
├── package.json              # Just calls node --test; no dependencies
├── CLAUDE.md                 # Working notes for this repository
├── README.md                 # Japanese version
├── README.en.md              # This document
├── LICENSE                   # MIT License
└── assets/
    ├── screenshot.png        # Screenshot of the Japanese view
    └── en/
        └── screenshot.png    # Screenshot of the English view
```

## ⚙️ Requirements

- A recent version of Chrome, Edge, Firefox or Safari
- No build step. Open `index.html` directly, or serve it over local HTTP
- Node.js 22 or later is needed to run the tests, not to use the tool

## 🏷️ Where the name comes from

**URLPurifier** comes from "purify". The tool takes the tracking data and affiliate tags out of a URL and returns it to a pure form.

TrimURL and URLTrimmer were among the candidates, but this name says most precisely what the tool is for.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🛠 About this tool

This tool was built as part of the "100 Security Tools with Generative AI" project, in which a security-related tool is created and published each day for 100 days, with the help of generative AI.

For the project and the other tools, see:

🔗 [https://akademeia.info/?page_id=42163](https://akademeia.info/?page_id=42163)
