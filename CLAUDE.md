# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

URLPurifier is a web tool designed to clean URLs by removing affiliate and tracking parameters. The tool helps users get clean, direct links without unnecessary tracking information.

## Project Status

This is a new project in initial setup phase. Currently contains only:
- README.md (Japanese description)
- MIT License
- .gitignore configured for Claude/ChatGPT local settings, macOS, and VSCode
- .nojekyll file (indicating potential GitHub Pages deployment)

## Development Notes

### Language Context
- Primary documentation is in Japanese
- Tool name "URLをクリーン化し、アフィリエイトやトラッキングパラメータを除去するWebツール" translates to "Web tool for cleaning URLs and removing affiliate and tracking parameters"

### Deployment Indication
- Presence of `.nojekyll` suggests this may be intended for GitHub Pages deployment
- Consider implementing as a static site with client-side JavaScript for URL processing

### Implementation Considerations
When implementing this tool, consider:
- Client-side JavaScript for privacy (no server-side logging of URLs)
- Support for common tracking parameters (utm_*, fbclid, gclid, etc.)
- Support for affiliate parameters from major platforms (Amazon, etc.)
- Clean, simple UI for ease of use
- Option to preserve certain parameters if needed

### Local Settings
The project includes a `.claude/settings.local.json` with custom permissions and hooks for local development environment.