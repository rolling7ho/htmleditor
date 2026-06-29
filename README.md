# HTML Article Editor

A browser-based rich text editor for writing and publishing HTML articles. No account, no cloud — everything runs locally in your browser.

## Features

- **Formatting** — Bold, italic, underline, strikethrough, inline code, highlight
- **Headings** — H1–H4, paragraph, via toolbar or `#` markdown shortcuts
- **Lists** — Bullet and ordered lists (`-` / `1.` shortcuts)
- **Blockquote & code blocks** — `>` and ` ``` ` shortcuts
- **Tables** — Visual grid picker, Tab navigation, add/delete rows and columns
- **Links** — Insert with `[text](url)` markdown or toolbar popover
- **Images** — Insert by URL or upload (auto-compressed to JPEG, max 1200px)
- **Alignment** — Left, center, right, justify
- **Text & background color** — Swatch picker with custom color input
- **HTML blocks** — Paste raw HTML wrapped in `<html>…</html>` to render it live in a sandboxed iframe
- **Google Fonts** — Switch font family per selection from a curated list
- **Font size** — Per-selection font sizing
- **Undo / redo** — Ctrl+Z / Ctrl+Y (or Cmd on Mac)
- **Markdown shortcuts** — `**bold**`, `*italic*`, `` `code` ``, `==highlight==`, `~~strike~~`, `__underline__`, `[text](url)`, `---` for HR
- **Posts feed** — Publish to a local feed stored in `localStorage`
- **Export** — Copy HTML to clipboard or download as `.html` file
- **Mobile** — Fully responsive, works on phone browsers

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To expose on your local network (for testing on a phone):

```bash
npm run dev -- -H 0.0.0.0
```

## Deploying

The fastest path is [Vercel](https://vercel.com):

1. Fork or clone this repo
2. Import it in the Vercel dashboard
3. Deploy — no configuration needed

Or build and run anywhere Node.js is available:

```bash
npm run build
npm start
```

## Tech

- [Next.js](https://nextjs.org) (App Router)
- TypeScript
- [DOMPurify](https://github.com/cure53/DOMPurify) for HTML sanitization
- No other runtime dependencies

## Security

- Content Security Policy, HSTS, X-Frame-Options, and Permissions-Policy headers on every response
- All pasted and user-supplied HTML is sanitized with DOMPurify before rendering
- HTML block iframes are sandboxed
- All link and image URLs are validated against an allowlist of safe protocols

## License

MIT
