# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

URLPurifier is a client-side web tool that cleans URLs by removing affiliate links and tracking parameters. The tool helps users share clean, direct links without unnecessary tracking information. Part of the "100 Security Tools with Generative AI" project (Day 039).

## Project Architecture

### File Structure
```
/
├── index.html      # Main HTML with form interface
├── script.js       # Core URL cleaning logic
├── style.css       # Dark-themed modern UI styles  
├── README.md       # Japanese documentation
└── CLAUDE.md       # This file
```

### Core Features
1. **URL Cleaning**: Removes tracking parameters (utm_*, fbclid, gclid, etc.)
2. **Amazon Optimization**: Special mode to convert Amazon URLs to shortest `/dp/ASIN` format
3. **Batch Processing**: Handles multiple URLs at once (line-by-line)
4. **Privacy-First**: All processing done client-side, no server communication

### Technical Implementation

#### URL Processing (script.js)
- **Parameter Blocking Lists**:
  - `COMMON_PREFIX_BLOCKS`: Parameters starting with specific strings (utm_, vero_, pk_)
  - `COMMON_EXACT_BLOCKS`: Exact parameter matches (fbclid, gclid, etc.)
  - `STRONG_EXACT_BLOCKS`: Additional aggressive blocking when enabled
  - `AMAZON_EXACT_BLOCKS`: Amazon-specific parameters (tag, ref, etc.)

- **Amazon ASIN Extraction**: Handles multiple URL patterns:
  - `/dp/ASIN`
  - `/gp/product/ASIN`
  - `/product/ASIN`
  - Query parameter `asin=ASIN`

- **Key Functions**:
  - `cleanOne()`: Processes single URL
  - `cleanBatch()`: Handles multiple URLs preserving line structure
  - `stripParams()`: Removes unwanted query parameters
  - `normalizeAmazon()`: Converts to `/dp/ASIN` format

#### UI/UX (index.html, style.css)
- Dark theme with gradient background
- Responsive card-based layout
- Two checkboxes for modes:
  - Amazon affiliate removal mode
  - Strong blocklist mode
- Three action buttons: Clean, Copy, Clear

## Development Commands

No build process required - pure HTML/CSS/JavaScript. For local development:
```bash
# Open directly in browser
open index.html

# Or use any local server
python -m http.server 8000
# Then visit http://localhost:8000
```

## Deployment

Deployed via GitHub Pages at: https://ipusiron.github.io/urlpurifier/
- `.nojekyll` file present for GitHub Pages compatibility
- No build/compilation needed

## Testing Considerations

When testing URL cleaning:
1. Test various Amazon URL formats (different locales: .com, .co.jp, etc.)
2. Verify ASIN extraction from different URL patterns
3. Test multi-line input preservation
4. Verify parameter removal completeness
5. Check edge cases (malformed URLs, missing protocols)

## Language Context
- UI and documentation primarily in Japanese
- Code comments in Japanese
- Part of educational project series on security tools