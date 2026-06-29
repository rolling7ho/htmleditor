import DOMPurify from "dompurify";
import { GOOGLE_FONTS, MAX_FONT_SIZE } from "./constants";

const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);
const SAFE_IMAGE_PROTOCOLS = new Set(["http:", "https:"]);
const SAFE_DATA_IMAGE_RE = /^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i;
const MAX_DATA_IMAGE_SRC_CHARS = 250_000;
const MAX_UPLOAD_BYTES = 5_000_000;
const SAFE_UPLOAD_MIME_RE = /^image\/(?:png|jpe?g|gif|webp)$/i;
const DEFAULT_IFRAME_STYLE =
  "width:100%;height:320px;border:1px solid #e8e8e8;border-radius:4px;margin:6px 0;display:block;background:#fff;";
const FORBIDDEN_HTML_BLOCK_TAGS = [
  "script", "style", "iframe", "object", "embed", "form", "input", "button",
  "select", "textarea", "link", "meta", "base",
];
const SAFE_STYLE_PROPERTIES = new Set([
  "background-color",
  "border",
  "border-color",
  "border-left",
  "border-radius",
  "border-style",
  "border-width",
  "color",
  "display",
  "font-family",
  "font-size",
  "font-style",
  "font-weight",
  "height",
  "line-height",
  "margin",
  "margin-bottom",
  "margin-left",
  "margin-right",
  "margin-top",
  "max-width",
  "padding",
  "padding-bottom",
  "padding-left",
  "padding-right",
  "padding-top",
  "text-align",
  "text-decoration",
  "vertical-align",
  "width",
]);
const FORBIDDEN_STYLE_VALUE_RE = /url\s*\(|expression\s*\(|@import|javascript:|data:|vbscript:|-moz-binding|behavior\s*:/i;
const SAFE_COLOR_RE = /^(#[0-9a-f]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)|[a-z]+)$/i;
const SAFE_LENGTH_RE = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:px|em|rem|%|pt)?$/i;
const SAFE_LENGTH_LIST_RE = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:px|em|rem|%|pt)?(?:\s+-?(?:0|[1-9]\d*)(?:\.\d+)?(?:px|em|rem|%|pt)?){0,3}$/i;
const POST_SANITIZE_CONFIG = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ["style", "form", "input", "button", "select", "textarea", "meta", "base", "link"],
  FORBID_ATTR: ["srcdoc", "srcset", "formaction"],
};

export function loadGoogleFont(family: string) {
  const id = `gfont-${family.replace(/\s+/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@300;400;700&display=swap`;
  document.head.appendChild(link);
}

export function getBlockTagAtCursor(): string {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return "p";
  let node: Node | null = sel.getRangeAt(0).startContainer;
  while (node && node.nodeType !== Node.ELEMENT_NODE) node = node.parentNode;
  if (!node) return "p";
  const tag = (node as Element).tagName.toLowerCase();
  return ["h1", "h2", "h3", "h4"].includes(tag) ? tag : "p";
}

export function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function hasControlCharacters(value: string): boolean {
  return /[\u0000-\u001f\u007f]/.test(value);
}

export function normalizeSafeLinkUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed || hasControlCharacters(trimmed)) return null;
  try {
    const parsed = new URL(trimmed, window.location.origin);
    if (!SAFE_LINK_PROTOCOLS.has(parsed.protocol)) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

export function normalizeSafeImageSrc(src: string): string | null {
  const trimmed = src.trim();
  if (!trimmed || hasControlCharacters(trimmed)) return null;
  if (trimmed.length > MAX_DATA_IMAGE_SRC_CHARS) return null;
  if (SAFE_DATA_IMAGE_RE.test(trimmed)) return trimmed.replace(/\s+/g, "");
  try {
    const parsed = new URL(trimmed, window.location.origin);
    if (!SAFE_IMAGE_PROTOCOLS.has(parsed.protocol)) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

export function getLinkAtCursor(): string {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return '';
  let node: Node | null = sel.getRangeAt(0).startContainer;
  while (node) {
    if (node instanceof HTMLAnchorElement) return node.href;
    node = node.parentNode;
  }
  return '';
}

export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!SAFE_UPLOAD_MIME_RE.test(file.type)) {
      reject(new Error("Unsupported image type"));
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      reject(new Error("Image too large"));
      return;
    }

    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const MAX = 1200;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width >= height) { height = Math.round(height * MAX / width); width = MAX; }
          else { width = Math.round(width * MAX / height); height = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.src = ev.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function cellAtCursor(): HTMLTableCellElement | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  let node: Node | null = sel.getRangeAt(0).startContainer;
  while (node && !(node instanceof HTMLTableCellElement)) node = node.parentNode;
  return node as HTMLTableCellElement | null;
}

export function tableColCount(table: HTMLTableElement): number {
  return table.querySelector("tr")?.children.length ?? 1;
}

export function clampFontSize(size: number, fallback = MAX_FONT_SIZE): number {
  if (!Number.isFinite(size)) return fallback;
  return Math.min(Math.max(Math.round(size), 1), MAX_FONT_SIZE);
}

export function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)     return "just now";
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function sanitizeHtmlBlockSrcdoc(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: FORBIDDEN_HTML_BLOCK_TAGS,
    FORBID_ATTR: ["style", "srcdoc", "srcset", "formaction"],
  });
}

function styleValueAllowed(property: string, value: string): boolean {
  const v = value.trim();
  if (!v || FORBIDDEN_STYLE_VALUE_RE.test(v)) return false;

  if (property === "color" || property === "background-color" || property.endsWith("-color")) {
    return SAFE_COLOR_RE.test(v);
  }
  if (property === "font-size") {
    const px = parseFloat(v);
    return SAFE_LENGTH_RE.test(v) && !isNaN(px) && px <= MAX_FONT_SIZE;
  }
  if (property === "width" || property === "max-width" || property === "height" || property === "line-height") {
    return v === "auto" || SAFE_LENGTH_RE.test(v);
  }
  if (property.startsWith("margin") || property.startsWith("padding") || property.startsWith("border")) {
    return /^[#\w\s.%()-]+$/.test(v) && !/fixed|absolute|sticky|url|calc/i.test(v);
  }
  if (property === "display") return /^(block|inline|inline-block|table|table-row|table-cell|none)$/i.test(v);
  if (property === "text-align") return /^(left|right|center|justify|start|end)$/i.test(v);
  if (property === "text-decoration") return /^[a-z\s-]+$/i.test(v);
  if (property === "font-family") return /^[\w\s"',-]+$/.test(v);
  if (property === "font-style") return /^(normal|italic|oblique)$/i.test(v);
  if (property === "font-weight") return /^(normal|bold|bolder|lighter|[1-9]00)$/i.test(v);
  if (property === "vertical-align") return /^(baseline|sub|super|top|middle|bottom|text-top|text-bottom)$/i.test(v) || SAFE_LENGTH_RE.test(v);
  return SAFE_LENGTH_LIST_RE.test(v);
}

function sanitizeInlineStyles(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>("[style]").forEach((el) => {
    const original = el.getAttribute("style") ?? "";
    const parsed = document.createElement("span");
    parsed.setAttribute("style", original);
    const kept: string[] = [];

    for (let i = 0; i < parsed.style.length; i += 1) {
      const prop = parsed.style.item(i).toLowerCase();
      const value = parsed.style.getPropertyValue(prop);
      if (!SAFE_STYLE_PROPERTIES.has(prop) || !styleValueAllowed(prop, value)) continue;
      if (prop === "font-size") {
        const px = parseFloat(value);
        kept.push(`${prop}:${!isNaN(px) && px > MAX_FONT_SIZE ? MAX_FONT_SIZE + "px" : value.trim()}`);
      } else {
        kept.push(`${prop}:${value.trim()}`);
      }
    }

    if (kept.length) el.setAttribute("style", kept.join(";"));
    else el.removeAttribute("style");
  });
}

// Returns sanitized, non-scripted iframe content. HTML blocks are isolated by
// iframe sandboxing and intentionally do not execute attacker-provided scripts.
export function makeResizingSrcdoc(html: string): string {
  return sanitizeHtmlBlockSrcdoc(html);
}

// Sanitizes post HTML with DOMPurify while preserving non-scripted <iframe> HTML blocks.
// Iframes are lifted out before sanitization because DOMPurify strips srcdoc. We
// restore only sanitized srcdoc with a fixed sandbox/style instead of trusting
// stored iframe attributes.
export function sanitizePostHtml(rawHtml: string): string {
  const template = document.createElement("template");
  template.innerHTML = rawHtml;

  type Saved = { srcdoc: string };
  const saved: Saved[] = [];
  template.content.querySelectorAll("iframe[srcdoc]").forEach((el, i) => {
    const frame = el as HTMLIFrameElement;
    saved.push({ srcdoc: sanitizeHtmlBlockSrcdoc(frame.srcdoc) });
    const marker = document.createElement("span");
    marker.id = `__hb${i}__`;
    el.parentNode!.replaceChild(marker, el);
  });

  const clean = document.createElement("div");
  const scratch = document.createElement("div");
  scratch.appendChild(template.content.cloneNode(true));
  clean.innerHTML = DOMPurify.sanitize(scratch.innerHTML, POST_SANITIZE_CONFIG);
  sanitizeInlineStyles(clean);

  // Ensure links that open a new tab cannot access window.opener.
  clean.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]').forEach((el) => {
    el.setAttribute('rel', 'noopener noreferrer');
  });

  saved.forEach(({ srcdoc }, i) => {
    const marker = clean.querySelector(`#__hb${i}__`);
    if (!marker) return;
    const frame = document.createElement("iframe");
    frame.srcdoc = makeResizingSrcdoc(srcdoc);
    frame.sandbox.value = "";
    frame.style.cssText = DEFAULT_IFRAME_STYLE;
    marker.parentNode!.replaceChild(frame, marker);
  });

  // Strip the <strong><html></strong> / <strong></html></strong> marker elements
  // that applyHtmlBlock inserts as visual delimiters in the editor.
  clean.querySelectorAll("strong, b").forEach((el) => {
    const t = el.textContent?.trim();
    if (t === "<html>" || t === "</html>" || t === "<title>" || t === "</title>") el.remove();
  });

  return clean.innerHTML;
}

// Scans the editor DOM for typed <title>...</title> text, extracts that
// string as the post title, and returns cleaned innerHTML with it removed.
export function extractTitleTag(el: HTMLElement): { title: string; html: string } {
  const clone = el.cloneNode(true) as HTMLElement;
  const re = /<title>([\s\S]*?)<\/title>/i;
  let title = "";

  const walk = (node: Node): boolean => {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node.textContent ?? "";
      const m = t.match(re);
      if (m) {
        title = m[1].trim().substring(0, 120);
        node.textContent = t.replace(re, "").trim();
        const p = node.parentElement;
        if (p && p !== clone && !(p.textContent ?? "").trim()) p.remove();
        return true;
      }
    }
    for (const c of Array.from(node.childNodes)) if (walk(c)) return true;
    return false;
  };

  walk(clone);
  return { title, html: clone.innerHTML };
}

export function buildDownloadHtml(bodyHtml: string): string {
  const safeBodyHtml = sanitizePostHtml(bodyHtml);
  const fontLinks = GOOGLE_FONTS.map((f) =>
    `  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(f.value)}:wght@300;400;700&display=swap">`
  ).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Article</title>
${fontLinks}
  <style>
    body { max-width: 860px; margin: 40px auto; padding: 0 24px; font-family: Inter, sans-serif; line-height: 1.7; color: #111; }
    img { max-width: 100%; height: auto; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #d8d8d8; padding: 8px 12px; text-align: left; }
    pre { background: #f5f5f5; padding: 16px; border-radius: 4px; overflow-x: auto; }
    code { background: #f0f0f0; padding: 2px 5px; border-radius: 3px; font-size: 0.9em; }
    blockquote { border-left: 3px solid #d8d8d8; margin: 0; padding-left: 20px; color: #555; }
    mark { background: #ffe066; padding: 0 2px; }
    a { color: #1a73e8; }
  </style>
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; frame-src 'none'; base-uri 'none'; form-action 'none'">
</head>
<body>
${safeBodyHtml}
</body>
</html>`;
}
