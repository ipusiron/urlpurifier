# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

URLPurifier is a client-side web tool that cleans URLs by removing affiliate links and tracking parameters. Part of the "100 Security Tools with Generative AI" project (Day 039). All processing is done entirely in-browser with no server communication.

## Development

No build process required - pure HTML/CSS/JavaScript.

```bash
# Open directly in browser (Windows)
start index.html

# Or use any local server
python -m http.server 8000
```

Deployed via GitHub Pages at: https://ipusiron.github.io/urlpurifier/

## Technical Architecture

### URL Processing Flow (script.js)

**Parameter Blocking Lists** (case-insensitive):
- `COMMON_PREFIX_BLOCKS`: Prefix matches (utm_, vero_, pk_, pf_rd_)
- `COMMON_EXACT_BLOCKS`: Exact matches (fbclid, gclid, msclkid, etc.)
- `STRONG_EXACT_BLOCKS`: Additional aggressive blocking for "詳細除去モード" (ttclid, twclid, campaign, etc.)
- `AMAZON_EXACT_BLOCKS`: Amazon-specific (tag, ref, linkCode, creative, psc, smid, keywords, qid, etc.)

**Key Functions**:
- `cleanOne(raw, opts)`: Single URL processing - returns `{cleaned, original, error, changed, stats}`
- `cleanBatch(multiline, opts)`: Multi-line processing with aggregated statistics
- `stripParams(urlObj, {strong, amazonMode})`: Parameter removal logic
- `normalizeAmazon(urlObj)`: Converts Amazon URLs to `/dp/ASIN` format
- `extractASIN(urlObj)`: Handles patterns: `/dp/ASIN`, `/gp/product/ASIN`, `/product/ASIN`, `?asin=ASIN`

**Amazon Domain Detection**: Regex `AMAZON_HOST_RE` supports .com, .co.jp, .co.uk, .de, .fr, .it, .es, .ca, .com.mx, .com.au, .nl, .sg, .in, .ae, .sa, .se, .pl, .eg, .tr

### UI Components

- **Theme Toggle**: Light/dark mode with localStorage persistence (`theme` key)
- **Statistics Display**: Shows processed URLs, changes made, and parameters removed
- **URL Preview**: Real-time preview for long URLs (>80 chars) with 300ms debounce
- **Help Modal**: Detailed parameter documentation accessible via "?" button
- **Toast Notifications**: Feedback for actions (success/error/info types)

### Form Element IDs
- `inputUrls`: Source textarea
- `outputUrls`: Result textarea (readonly)
- `amazonMode`: Amazon mode checkbox
- `strictBlocklist`: Strong/detailed removal mode checkbox (Note: HTML uses `strictBlocklist`, code variable is `$strong`)

## Testing Considerations

- Amazon URL formats across locales (.com, .co.jp, etc.)
- ASIN extraction from various URL patterns
- Multi-line batch processing
- Edge cases: malformed URLs, missing protocols (auto-prefixes https://)
- XSS safety: `escapeHtml()` sanitizes preview output

## Language Context
- UI and documentation in Japanese
- Code comments in Japanese