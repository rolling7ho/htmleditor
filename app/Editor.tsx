"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_FONT_SIZE, GOOGLE_FONTS, HEADINGS, MAX_FONT_SIZE, SHORTCUTS } from "./editor/constants";
import { POST_COUNT_KEY, STORAGE_KEY } from "./editor/constants";
import { Post } from "./editor/types";
import {
  loadGoogleFont, getBlockTagAtCursor, esc, getLinkAtCursor,
  cellAtCursor, tableColCount, sanitizePostHtml, extractTitleTag,
  makeResizingSrcdoc, buildDownloadHtml, clampFontSize,
  normalizeSafeLinkUrl, normalizeSafeImageSrc,
} from "./editor/helpers";
import { styles } from "./editor/styles";
import { Btn, Sep } from "./editor/Toolbar";
import { TablePicker } from "./editor/TablePicker";
import { TableBar } from "./editor/TableBar";
import { LinkPopover } from "./editor/LinkPopover";
import { ColorSwatchPicker } from "./editor/ColorSwatchPicker";
import { ImagePopover } from "./editor/ImagePopover";
import { PostFeed } from "./editor/PostFeed";
import {
  BulletIcon, OrderedIcon, QuoteIcon, HrIcon,
  CodeInlineIcon, CodeBlockIcon, HighlightIcon,
  LinkIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, AlignJustifyIcon,
  TextColorIcon, BgColorIcon, ImageIcon, TableIcon,
} from "./editor/icons";

const MAX_POST_BYTES = 250_000;
const MAX_STORED_POSTS_BYTES = 1_000_000;

function isPost(value: unknown): value is Post {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Record<keyof Post, unknown>>;
  return typeof candidate.id === "string" &&
    typeof candidate.html === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.createdAt === "string";
}

export default function Editor() {
  const editorRef      = useRef<HTMLDivElement>(null);
  const savedRangeRef  = useRef<Range | null>(null);
  const tableCellRef   = useRef<HTMLTableCellElement | null>(null);
  const tableWrapRef   = useRef<HTMLDivElement>(null);
  const tableBtnRef    = useRef<HTMLButtonElement>(null);
  const linkBtnRef     = useRef<HTMLButtonElement>(null);
  const linkWrapRef    = useRef<HTMLDivElement>(null);
  const textColorBtnRef   = useRef<HTMLButtonElement>(null);
  const textColorWrapRef  = useRef<HTMLDivElement>(null);
  const textColorInputRef = useRef<HTMLInputElement>(null);
  const bgColorBtnRef     = useRef<HTMLButtonElement>(null);
  const bgColorWrapRef    = useRef<HTMLDivElement>(null);
  const bgColorInputRef   = useRef<HTMLInputElement>(null);
  const imageBtnRef    = useRef<HTMLButtonElement>(null);
  const imageWrapRef   = useRef<HTMLDivElement>(null);
  const postsRef       = useRef<HTMLDivElement>(null);

  const undoStack  = useRef<string[]>([]);
  const redoStack  = useRef<string[]>([]);
  const snapTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeFont,    setActiveFont]    = useState("Inter");
  const [fontSizeInput, setFontSizeInput] = useState("16");
  const [heading,       setHeading]       = useState("p");
  const [isBold,        setIsBold]        = useState(false);
  const [isItalic,      setIsItalic]      = useState(false);
  const [isUnderline,   setIsUnderline]   = useState(false);
  const [isStrike,      setIsStrike]      = useState(false);
  const [isCode,        setIsCode]        = useState(false);
  const [isHighlight,   setIsHighlight]   = useState(false);
  const [isBullet,      setIsBullet]      = useState(false);
  const [isOrdered,     setIsOrdered]     = useState(false);
  const [isBlockquote,  setIsBlockquote]  = useState(false);
  const [isCodeBlock,   setIsCodeBlock]   = useState(false);
  const [isLink,           setIsLink]           = useState(false);
  const [linkPopoverOpen,  setLinkPopoverOpen]  = useState(false);
  const [linkPopoverPos,   setLinkPopoverPos]   = useState({ top: 0, left: 0 });
  const [linkCurrentUrl,   setLinkCurrentUrl]   = useState('');
  const [linkHasSelection, setLinkHasSelection] = useState(false);
  const [alignLeft,   setAlignLeft]   = useState(false);
  const [alignCenter, setAlignCenter] = useState(false);
  const [alignRight,  setAlignRight]  = useState(false);
  const [alignFull,   setAlignFull]   = useState(false);
  const [textColorOpen, setTextColorOpen] = useState(false);
  const [bgColorOpen,   setBgColorOpen]   = useState(false);
  const [textColorPos,  setTextColorPos]  = useState({ top: 0, left: 0 });
  const [bgColorPos,    setBgColorPos]    = useState({ top: 0, left: 0 });
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [imagePickerPos,  setImagePickerPos]  = useState({ top: 0, left: 0 });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPos,  setPickerPos]  = useState({ top: 0, left: 0 });
  const [tableBar, setTableBar] = useState<{ top: number; left: number; width: number } | null>(null);
  const [posts, setPosts]   = useState<Post[]>([]);
  const [toast, setToast]   = useState(false);
  const [copyToast, setCopyToast] = useState(false);

  // ── Lifecycle ────────────────────────────────────────────────────────────

  useEffect(() => {
    GOOGLE_FONTS.forEach((f) => loadGoogleFont(f.value));
    undoStack.current = [editorRef.current?.innerHTML ?? ""];
    updatePlaceholder();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setPosts(parsed.filter(isPost).map((p) => ({ ...p, html: sanitizePostHtml(p.html) })));
        }
      }
    } catch { /* ignore corrupt storage */ }
    return () => { if (snapTimer.current) clearTimeout(snapTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Click-outside handlers for all popovers
  useEffect(() => {
    if (!pickerOpen) return;
    const close = (e: MouseEvent) => {
      if (!tableWrapRef.current?.contains(e.target as Node)) setPickerOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [pickerOpen]);

  useEffect(() => {
    if (!linkPopoverOpen) return;
    const close = (e: MouseEvent) => {
      if (!linkWrapRef.current?.contains(e.target as Node)) setLinkPopoverOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [linkPopoverOpen]);

  useEffect(() => {
    if (!textColorOpen) return;
    const close = (e: MouseEvent) => {
      if (!textColorWrapRef.current?.contains(e.target as Node)) setTextColorOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [textColorOpen]);

  useEffect(() => {
    if (!bgColorOpen) return;
    const close = (e: MouseEvent) => {
      if (!bgColorWrapRef.current?.contains(e.target as Node)) setBgColorOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [bgColorOpen]);

  useEffect(() => {
    if (!imagePickerOpen) return;
    const close = (e: MouseEvent) => {
      if (!imageWrapRef.current?.contains(e.target as Node)) setImagePickerOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [imagePickerOpen]);

  // ── Placeholder ──────────────────────────────────────────────────────────

  // :empty doesn't match after Chromium leaves a <br> on clear, so we use JS.
  const updatePlaceholder = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const empty = !el.textContent?.trim() && !el.querySelector('img,iframe,table,hr');
    el.toggleAttribute('data-empty', empty);
  }, []);

  // ── Undo / redo ──────────────────────────────────────────────────────────

  const takeSnapshot = useCallback(() => {
    const html = editorRef.current?.innerHTML ?? "";
    if (html === undoStack.current[undoStack.current.length - 1]) return;
    undoStack.current.push(html);
    if (undoStack.current.length > 100) undoStack.current.shift();
    redoStack.current = [];
  }, []);

  const scheduleSnapshot = useCallback(() => {
    if (snapTimer.current) clearTimeout(snapTimer.current);
    snapTimer.current = setTimeout(takeSnapshot, 400);
  }, [takeSnapshot]);

  const applySnapshot = useCallback((html: string) => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = html;
    tableCellRef.current = null;
    setTableBar(null);
    editorRef.current.focus();
    updatePlaceholder();
  }, [updatePlaceholder]);

  const undo = useCallback(() => {
    if (snapTimer.current) { clearTimeout(snapTimer.current); snapTimer.current = null; }
    takeSnapshot();
    if (undoStack.current.length <= 1) return;
    const current = undoStack.current.pop()!;
    redoStack.current.push(current);
    applySnapshot(undoStack.current[undoStack.current.length - 1] ?? "");
  }, [takeSnapshot, applySnapshot]);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    const next = redoStack.current.pop()!;
    undoStack.current.push(next);
    applySnapshot(next);
  }, [applySnapshot]);

  // ── Selection ────────────────────────────────────────────────────────────

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedRangeRef.current = sel.getRangeAt(0).cloneRange();
  };

  const restoreSelection = useCallback(() => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  }, []);

  const exec = useCallback((cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  }, []);

  const insertNodeAtSelection = useCallback((node: Node): boolean => {
    const root = editorRef.current;
    const sel = window.getSelection();
    if (!root || !sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer;
    if (container !== root && !root.contains(container)) return false;

    range.deleteContents();
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    root.focus();
    return true;
  }, []);

  // ── Active-state sync ────────────────────────────────────────────────────

  const checkTableCursor = useCallback(() => {
    const cell = cellAtCursor();
    tableCellRef.current = cell;
    if (!cell) { setTableBar(null); return; }
    const table = cell.closest("table");
    if (!table) { setTableBar(null); return; }
    const r = table.getBoundingClientRect();
    setTableBar({ top: r.top - 42, left: r.left, width: r.width });
  }, []);

  const updateActiveStates = useCallback(() => {
    const nodeInTag = (tag: string, start: Node | null): boolean => {
      let n: Node | null = start;
      while (n && n !== editorRef.current) {
        if (n instanceof HTMLElement && n.tagName === tag) return true;
        n = n.parentNode;
      }
      return false;
    };

    const inAncestor = (tag: string): boolean => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return false;
      return nodeInTag(tag, sel.getRangeAt(0).startContainer);
    };

    // queryCommandState("bold") doesn't detect <strong>/<b> in Chromium.
    // Supplement with ancestor walk for both endpoints of a range.
    const checkBold = (): boolean => {
      if (document.queryCommandState("bold")) return true;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return false;
      const range = sel.getRangeAt(0);
      const isBoldAt = (n: Node | null) => nodeInTag("STRONG", n) || nodeInTag("B", n);
      return range.collapsed
        ? isBoldAt(range.startContainer)
        : isBoldAt(range.startContainer) && isBoldAt(range.endContainer);
    };

    setIsBold(checkBold());
    setIsItalic(document.queryCommandState("italic"));
    setIsUnderline(document.queryCommandState("underline"));
    setIsStrike(document.queryCommandState("strikeThrough"));
    setIsBullet(document.queryCommandState("insertUnorderedList"));
    setIsOrdered(document.queryCommandState("insertOrderedList"));
    const inPre = inAncestor("PRE");
    setIsCodeBlock(inPre);
    setIsCode(inAncestor("CODE") && !inPre);
    setIsHighlight(inAncestor("MARK"));
    setIsBlockquote(inAncestor("BLOCKQUOTE"));
    setIsLink(inAncestor("A"));
    setAlignLeft(document.queryCommandState("justifyLeft"));
    setAlignCenter(document.queryCommandState("justifyCenter"));
    setAlignRight(document.queryCommandState("justifyRight"));
    setAlignFull(document.queryCommandState("justifyFull"));
    setHeading(getBlockTagAtCursor());
    checkTableCursor();
  }, [checkTableCursor]);

  // ── Font ─────────────────────────────────────────────────────────────────

  const handleFontChange = (font: string) => {
    takeSnapshot();
    setActiveFont(font);
    restoreSelection();
    document.execCommand("fontName", false, font);
    editorRef.current?.focus();
  };

  // ── Font size ─────────────────────────────────────────────────────────────

  const applyFontSize = useCallback((size: number) => {
    const safeSize = clampFontSize(size);
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) { editorRef.current?.focus(); return; }
    takeSnapshot();
    try {
      const span = document.createElement("span");
      span.style.fontSize = `${safeSize}px`;
      range.surroundContents(span);
      sel.removeAllRanges();
    } catch {
      editorRef.current?.querySelectorAll("font[size='7']").forEach((el) =>
        el.setAttribute("data-fs-pre", "1")
      );
      document.execCommand("fontSize", false, "7");
      editorRef.current?.querySelectorAll("font[size='7']:not([data-fs-pre])").forEach((el) => {
        const span = document.createElement("span");
        span.style.fontSize = `${safeSize}px`;
        const h = el as HTMLElement;
        while (h.firstChild) span.appendChild(h.firstChild);
        el.replaceWith(span);
      });
      editorRef.current?.querySelectorAll("[data-fs-pre]").forEach((el) =>
        el.removeAttribute("data-fs-pre")
      );
    }
    editorRef.current?.focus();
  }, [restoreSelection, takeSnapshot]);

  const commitFontSize = () => {
    const n = parseInt(fontSizeInput, 10);
    if (!isNaN(n) && n >= 1) {
      const safeSize = clampFontSize(n);
      setFontSizeInput(String(safeSize));
      applyFontSize(safeSize);
    } else {
      setFontSizeInput(String(DEFAULT_FONT_SIZE));
    }
  };

  // ── Heading ───────────────────────────────────────────────────────────────

  const handleHeading = (tag: string) => {
    takeSnapshot();
    setHeading(tag);
    restoreSelection();
    document.execCommand("formatBlock", false, tag);
    editorRef.current?.focus();
  };

  // ── Format toggles ────────────────────────────────────────────────────────

  const toggleBold      = () => { takeSnapshot(); exec("bold");          updateActiveStates(); };
  const toggleItalic    = () => { takeSnapshot(); exec("italic");        updateActiveStates(); };
  const toggleUnderline = () => { takeSnapshot(); exec("underline");     updateActiveStates(); };
  const toggleStrike    = () => { takeSnapshot(); exec("strikeThrough"); updateActiveStates(); };

  // ── Inline wrap ───────────────────────────────────────────────────────────

  const wrapSelectionWith = (open: string, close: string, placeholder: string) => {
    takeSnapshot();
    const sel = window.getSelection();
    const inner = sel && !sel.isCollapsed ? esc(sel.toString()) : placeholder;
    exec("insertHTML", `${open}${inner}${close}`);
  };

  const unwrapAncestor = (tag: string) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    let node: Node | null = sel.getRangeAt(0).startContainer;
    while (node && node !== editorRef.current) {
      if (node instanceof HTMLElement && node.tagName === tag) {
        const parent = node.parentNode!;
        while (node.firstChild) parent.insertBefore(node.firstChild, node);
        parent.removeChild(node);
        return;
      }
      node = node.parentNode;
    }
  };

  const toggleInlineCode = () => {
    takeSnapshot();
    if (isCode) { unwrapAncestor("CODE"); } else { wrapSelectionWith("<code>", "</code>", "code"); }
    updateActiveStates();
  };

  const toggleHighlight = () => {
    takeSnapshot();
    if (isHighlight) { unwrapAncestor("MARK"); } else { wrapSelectionWith("<mark>", "</mark>", "highlighted"); }
    updateActiveStates();
  };

  const toggleBullet    = () => { takeSnapshot(); exec("insertUnorderedList"); updateActiveStates(); };
  const toggleOrdered   = () => { takeSnapshot(); exec("insertOrderedList");   updateActiveStates(); };
  const toggleBlockquote = () => { takeSnapshot(); exec("formatBlock", isBlockquote ? "p" : "blockquote"); updateActiveStates(); };
  const toggleCodeBlock  = () => { takeSnapshot(); exec("formatBlock", isCodeBlock  ? "p" : "pre");        updateActiveStates(); };

  // ── Link ──────────────────────────────────────────────────────────────────

  const openLinkPopover = () => {
    saveSelection();
    const sel = window.getSelection();
    setLinkHasSelection(!!(sel && !sel.isCollapsed));
    setLinkCurrentUrl(getLinkAtCursor());
    const btn = linkBtnRef.current;
    if (btn) {
      const r = btn.getBoundingClientRect();
      setLinkPopoverPos({ top: r.bottom + 6, left: clampLeft(r.left, 296) });
    }
    setLinkPopoverOpen((v) => !v);
  };

  const applyLink = (url: string, text?: string) => {
    setLinkPopoverOpen(false);
    const safeUrl = normalizeSafeLinkUrl(url);
    if (!safeUrl) return;
    restoreSelection();
    takeSnapshot();
    const sel = window.getSelection();
    if (sel && sel.isCollapsed && text) {
      const a = document.createElement("a");
      a.href = safeUrl;
      a.rel = "noopener noreferrer";
      a.textContent = text;
      insertNodeAtSelection(a);
    } else if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      const container = range.commonAncestorContainer;
      if (editorRef.current && (container === editorRef.current || editorRef.current.contains(container))) {
        const a = document.createElement("a");
        a.href = safeUrl;
        a.rel = "noopener noreferrer";
        a.appendChild(range.extractContents());
        range.insertNode(a);
        range.setStartAfter(a);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    } else {
      const a = document.createElement("a");
      a.href = safeUrl;
      a.rel = "noopener noreferrer";
      a.textContent = safeUrl;
      insertNodeAtSelection(a);
    }
    editorRef.current?.focus();
    updateActiveStates();
  };

  const removeLink = () => {
    setLinkPopoverOpen(false);
    restoreSelection();
    takeSnapshot();
    document.execCommand('unlink');
    editorRef.current?.focus();
    updateActiveStates();
  };

  // ── Alignment ─────────────────────────────────────────────────────────────

  const setAlignment = (dir: 'Left' | 'Center' | 'Right' | 'Full') => {
    takeSnapshot();
    exec(`justify${dir}`);
    updateActiveStates();
  };

  // ── Color ─────────────────────────────────────────────────────────────────

  const openTextColorPicker = () => {
    saveSelection();
    const btn = textColorBtnRef.current;
    if (btn) {
      const r = btn.getBoundingClientRect();
      setTextColorPos({ top: r.bottom + 6, left: clampLeft(r.left, 120) });
    }
    setBgColorOpen(false);
    setTextColorOpen((v) => !v);
  };

  const applyTextColor = (color: string) => {
    setTextColorOpen(false);
    restoreSelection();
    takeSnapshot();
    document.execCommand('foreColor', false, color);
    editorRef.current?.focus();
  };

  const openBgColorPicker = () => {
    saveSelection();
    const btn = bgColorBtnRef.current;
    if (btn) {
      const r = btn.getBoundingClientRect();
      setBgColorPos({ top: r.bottom + 6, left: clampLeft(r.left, 120) });
    }
    setTextColorOpen(false);
    setBgColorOpen((v) => !v);
  };

  const applyBgColor = (color: string) => {
    setBgColorOpen(false);
    restoreSelection();
    takeSnapshot();
    document.execCommand('hiliteColor', false, color);
    editorRef.current?.focus();
  };

  // ── Image ─────────────────────────────────────────────────────────────────

  const openImagePicker = () => {
    saveSelection();
    const btn = imageBtnRef.current;
    if (btn) {
      const r = btn.getBoundingClientRect();
      setImagePickerPos({ top: r.bottom + 6, left: clampLeft(r.left, 276) });
    }
    setImagePickerOpen((v) => !v);
  };

  const insertImage = useCallback((src: string) => {
    setImagePickerOpen(false);
    const safeSrc = normalizeSafeImageSrc(src);
    if (!safeSrc) return;
    restoreSelection();
    takeSnapshot();
    const img = document.createElement("img");
    img.src = safeSrc;
    img.alt = "";
    img.style.maxWidth = "100%";
    img.style.height = "auto";
    img.style.display = "block";
    img.style.margin = "4px 0";
    insertNodeAtSelection(img);
    updateActiveStates();
    updatePlaceholder();
  }, [restoreSelection, takeSnapshot, insertNodeAtSelection, updateActiveStates, updatePlaceholder]);

  // ── Posts ─────────────────────────────────────────────────────────────────

  const handlePost = () => {
    if (!editorRef.current) return;
    const original = editorRef.current.innerHTML;
    if (!original.trim() || original === "<br>" || original === "<p><br></p>") return;
    const { title: tagTitle, html: rawCleaned } = extractTitleTag(editorRef.current);
    const postFontSize = clampFontSize(parseInt(fontSizeInput, 10), DEFAULT_FONT_SIZE);
    const htmlBody = postFontSize === DEFAULT_FONT_SIZE
      ? rawCleaned
      : `<div style="font-size:${postFontSize}px">${rawCleaned}</div>`;
    const html = sanitizePostHtml(htmlBody);
    if (new Blob([html]).size > MAX_POST_BYTES) return;
    let count = 1;
    try {
      count = (parseInt(localStorage.getItem(POST_COUNT_KEY) ?? "0", 10) || 0) + 1;
    } catch { /* storage may be unavailable */ }
    const post: Post = {
      id: Date.now().toString(),
      html,
      title: tagTitle || `My Post ${count}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [post, ...posts];
    const serialized = JSON.stringify(updated);
    if (new Blob([serialized]).size > MAX_STORED_POSTS_BYTES) return;
    try {
      localStorage.setItem(POST_COUNT_KEY, String(count));
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch { return; }
    setPosts(updated);
    editorRef.current.innerHTML = "";
    updatePlaceholder();
    undoStack.current = [""];
    redoStack.current = [];
    setToast(true);
    setTimeout(() => setToast(false), 2200);
    setTimeout(() => postsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const deletePost = (id: string) => {
    const updated = posts.filter((p) => p.id !== id);
    setPosts(updated);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { /* quota */ }
  };

  // ── Export ────────────────────────────────────────────────────────────────

  const handleCopyHtml = async () => {
    const html = sanitizePostHtml(editorRef.current?.innerHTML ?? '');
    try {
      await navigator.clipboard.writeText(html);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 1800);
    } catch { /* clipboard not available */ }
  };

  const handleDownloadHtml = () => {
    const html = sanitizePostHtml(editorRef.current?.innerHTML ?? '');
    const blob = new Blob([buildDownloadHtml(html)], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'article.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };

  // ── Table picker ──────────────────────────────────────────────────────────

  const openPicker = () => {
    saveSelection();
    const btn = tableBtnRef.current;
    if (btn) {
      const r = btn.getBoundingClientRect();
      setPickerPos({ top: r.bottom + 6, left: clampLeft(r.left, 180) });
    }
    setPickerOpen((v) => !v);
  };

  const insertTable = (rows: number, cols: number) => {
    setPickerOpen(false);
    restoreSelection();
    takeSnapshot();
    const hd = Array.from({ length: cols }, (_, i) => `<th>Col ${i + 1}</th>`).join("");
    const bd = Array.from({ length: cols }, () => "<td><br></td>").join("");
    const bodyRows = Array.from({ length: rows }, () => `<tr>${bd}</tr>`).join("");
    document.execCommand("insertHTML", false,
      `<table><thead><tr>${hd}</tr></thead><tbody>${bodyRows}</tbody></table><p><br></p>`);
    editorRef.current?.focus();
  };

  // ── Table operations ──────────────────────────────────────────────────────

  const withCell = useCallback((fn: (cell: HTMLTableCellElement) => void) => {
    const cell = tableCellRef.current;
    if (!cell) return;
    takeSnapshot();
    fn(cell);
    editorRef.current?.focus();
    setTimeout(checkTableCursor, 0);
  }, [takeSnapshot, checkTableCursor]);

  const tblAddRowAbove = () => withCell((cell) => {
    const row = cell.closest("tr")!;
    const n   = tableColCount(cell.closest("table") as HTMLTableElement);
    const newRow = document.createElement("tr");
    for (let i = 0; i < n; i++) { const td = document.createElement("td"); td.innerHTML = "<br>"; newRow.appendChild(td); }
    row.parentNode!.insertBefore(newRow, row);
  });

  const tblAddRowBelow = () => withCell((cell) => {
    const row = cell.closest("tr")!;
    const n   = tableColCount(cell.closest("table") as HTMLTableElement);
    const newRow = document.createElement("tr");
    for (let i = 0; i < n; i++) { const td = document.createElement("td"); td.innerHTML = "<br>"; newRow.appendChild(td); }
    row.parentNode!.insertBefore(newRow, row.nextSibling);
  });

  const tblAddColLeft = () => withCell((cell) => {
    const idx = cell.cellIndex;
    const table = cell.closest("table") as HTMLTableElement;
    table.querySelectorAll("tr").forEach((row) => {
      const isHdr = row.cells[idx]?.tagName === "TH";
      const c = document.createElement(isHdr ? "th" : "td"); c.innerHTML = "<br>";
      row.insertBefore(c, row.cells[idx]);
    });
  });

  const tblAddColRight = () => withCell((cell) => {
    const idx = cell.cellIndex;
    const table = cell.closest("table") as HTMLTableElement;
    table.querySelectorAll("tr").forEach((row) => {
      const isHdr = row.cells[idx]?.tagName === "TH";
      const c = document.createElement(isHdr ? "th" : "td"); c.innerHTML = "<br>";
      const after = row.cells[idx + 1];
      if (after) row.insertBefore(c, after); else row.appendChild(c);
    });
  });

  const tblDeleteRow = () => withCell((cell) => {
    const row = cell.closest("tr")!;
    const table = cell.closest("table")!;
    if (table.querySelectorAll("tr").length <= 1) table.remove(); else row.remove();
  });

  const tblDeleteCol = () => withCell((cell) => {
    const idx = cell.cellIndex;
    const table = cell.closest("table") as HTMLTableElement;
    if (tableColCount(table) <= 1) { table.remove(); return; }
    table.querySelectorAll("tr").forEach((row) => row.cells[idx]?.remove());
  });

  const tblDeleteTable = () => withCell((cell) => {
    cell.closest("table")?.remove();
    setTableBar(null);
    tableCellRef.current = null;
  });

  // ── Inline markdown ───────────────────────────────────────────────────────

  const applyInlineWrap = (
    node: Text, cursorOffset: number, match: RegExpMatchArray,
    openTag: string, closeTag: string
  ) => {
    takeSnapshot();
    const inner = match[1];
    const matchStart = cursorOffset - match[0].length;
    const sel = window.getSelection();
    if (!sel) return;
    const range = document.createRange();
    range.setStart(node, matchStart);
    range.setEnd(node, cursorOffset);
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand("insertHTML", false, `${openTag}${esc(inner)}${closeTag}`);
    editorRef.current?.focus();
  };

  const tryInlineMarkdown = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return;
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return;

    const text   = node.textContent ?? "";
    const offset = range.startOffset;
    const before = text.substring(0, offset);

    const bold   = before.match(/\*\*(.+?)\*\*$/);
    if (bold)   { applyInlineWrap(node as Text, offset, bold,   "<strong>", "</strong>"); return; }
    const strike = before.match(/~~(.+?)~~$/);
    if (strike) { applyInlineWrap(node as Text, offset, strike, "<del>",    "</del>");    return; }
    const code   = before.match(/`([^`]+?)`$/);
    if (code)   { applyInlineWrap(node as Text, offset, code,   "<code>",   "</code>");   return; }
    const hl     = before.match(/==(.+?)==$/);
    if (hl)     { applyInlineWrap(node as Text, offset, hl,     "<mark>",   "</mark>");   return; }
    const uline  = before.match(/__([^_]+?)__$/);
    if (uline)  { applyInlineWrap(node as Text, offset, uline,  '<span style="text-decoration:underline">', "</span>"); return; }
    const iStar  = before.match(/(?<!\*)\*(?!\*)([^*]+?)\*(?!\*)$/);
    if (iStar)  { applyInlineWrap(node as Text, offset, iStar,  "<em>", "</em>"); return; }
    const iUnd   = before.match(/(?<!_)_(?!_)([^_]+?)_(?!_)$/);
    if (iUnd)   { applyInlineWrap(node as Text, offset, iUnd,   "<em>", "</em>"); return; }
    const mdLink = before.match(/\[([^\]]+)\]\(([^)]+)\)$/);
    if (mdLink) {
      const safeUrl = normalizeSafeLinkUrl(mdLink[2]);
      if (safeUrl) applyInlineWrap(node as Text, offset, mdLink, `<a href="${esc(safeUrl)}" rel="noopener noreferrer">`, "</a>");
      return;
    }
  };

  // ── Block markdown ────────────────────────────────────────────────────────

  const tryBlockMarkdown = (): boolean => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return false;
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return false;

    const text   = node.textContent ?? "";
    const offset = range.startOffset;
    const before = text.substring(0, offset);

    const placeAt = (n: Node, pos: number) => {
      const r = document.createRange(); r.setStart(n, pos); r.collapse(true);
      sel.removeAllRanges(); sel.addRange(r);
    };
    const clearAndRun = (fn: () => void) => {
      takeSnapshot();
      node.textContent = text.substring(offset);
      placeAt(node, 0);
      fn();
    };

    const hMatch = before.match(/^(#{1,4})$/);
    if (hMatch) {
      const tag = `h${hMatch[1].length}`;
      clearAndRun(() => document.execCommand("formatBlock", false, tag));
      setHeading(tag); return true;
    }
    if (before === "-" || before === "*" || before === "+") {
      clearAndRun(() => document.execCommand("insertUnorderedList")); return true;
    }
    if (before === "1.")  { clearAndRun(() => document.execCommand("insertOrderedList")); return true; }
    if (before === ">")   { clearAndRun(() => document.execCommand("formatBlock", false, "blockquote")); return true; }
    if (before === "---") { clearAndRun(() => document.execCommand("insertHTML", false, "<hr><p><br></p>")); return true; }
    return false;
  };

  // ── Table keyboard nav ────────────────────────────────────────────────────

  const handleTableTab = (e: React.KeyboardEvent): boolean => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    let node: Node | null = sel.getRangeAt(0).startContainer;
    while (node && !(node instanceof HTMLTableCellElement)) node = node.parentNode;
    if (!node) return false;

    const cell  = node as HTMLTableCellElement;
    const table = cell.closest("table")!;
    const cells = Array.from(table.querySelectorAll<HTMLTableCellElement>("th, td"));
    const idx   = cells.indexOf(cell);

    const focusCell = (c: HTMLElement) => {
      const r = document.createRange(); r.selectNodeContents(c); r.collapse(false);
      sel.removeAllRanges(); sel.addRange(r);
      editorRef.current?.focus();
      checkTableCursor();
    };

    e.preventDefault();
    if (e.shiftKey) { if (idx > 0) focusCell(cells[idx - 1]); return true; }
    if (idx < cells.length - 1) {
      focusCell(cells[idx + 1]);
    } else {
      const n = tableColCount(table as HTMLTableElement);
      const tbody = table.querySelector("tbody") ?? table;
      const row = document.createElement("tr");
      for (let i = 0; i < n; i++) {
        const td = document.createElement("td"); td.innerHTML = "<br>"; row.appendChild(td);
      }
      tbody.appendChild(row);
      focusCell(row.firstElementChild as HTMLElement);
    }
    return true;
  };

  // ── Main key handler ──────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
    if (mod && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); return; }
    if (e.key === "Tab" && handleTableTab(e)) return;

    if (e.key === "Enter") {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && sel.isCollapsed) {
        const range = sel.getRangeAt(0);

        // Exit blockquote on Enter in an empty line
        let bq: HTMLElement | null = null;
        let cur: Node | null = range.startContainer;
        while (cur && cur !== editorRef.current) {
          if (cur instanceof HTMLElement && cur.tagName === "BLOCKQUOTE") { bq = cur; break; }
          cur = cur.parentNode;
        }
        if (bq) {
          let lineEl: Node | null = range.startContainer;
          while (lineEl && lineEl.parentNode !== bq) lineEl = lineEl.parentNode;
          if (!(lineEl?.textContent ?? "").trim()) {
            e.preventDefault();
            takeSnapshot();
            if (lineEl && lineEl.parentNode === bq) bq.removeChild(lineEl);
            const p = document.createElement("p"); p.innerHTML = "<br>";
            bq.insertAdjacentElement("afterend", p);
            if (!(bq.textContent ?? "").trim()) bq.remove();
            const nr = document.createRange();
            nr.setStart(p, 0); nr.collapse(true);
            sel.removeAllRanges(); sel.addRange(nr);
            return;
          }
        }

        // ``` + Enter → code block
        if (range.startContainer.nodeType === Node.TEXT_NODE) {
          const tn = range.startContainer as Text;
          const before = (tn.textContent ?? "").substring(0, range.startOffset).trim();
          if (before === "```") {
            e.preventDefault();
            takeSnapshot();
            tn.textContent = (tn.textContent ?? "").substring(range.startOffset);
            const r = document.createRange(); r.setStart(tn, 0); r.collapse(true);
            sel.removeAllRanges(); sel.addRange(r);
            document.execCommand("formatBlock", false, "pre");
            return;
          }
        }
      }
    }

    if (e.key === " " && tryBlockMarkdown()) { e.preventDefault(); return; }
    updateActiveStates();
  };

  // ── HTML block rendering ──────────────────────────────────────────────────

  const applyHtmlBlock = () => {
    const el = editorRef.current;
    if (!el) return;
    const raw = el.innerHTML;
    if (!raw.includes("&lt;html&gt;") || !raw.includes("&lt;/html&gt;")) return;
    if (raw.includes("<strong>&lt;html&gt;</strong>")) return;

    const text = el.textContent ?? "";
    const htmlStart = text.indexOf("<html>");
    const htmlEnd   = text.lastIndexOf("</html>");
    if (htmlStart === -1 || htmlEnd === -1 || htmlEnd <= htmlStart) return;

    const innerHtml = text.slice(htmlStart + "<html>".length, htmlEnd).trim();

    // useLast=true finds the final occurrence — needed for </html> since a pasted
    // full HTML document also contains its own </html> before our closing marker.
    const findText = (search: string, useLast = false): { node: Text; offset: number } | null => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let node: Text | null;
      let result: { node: Text; offset: number } | null = null;
      while ((node = walker.nextNode() as Text | null)) {
        const tag = node.parentElement?.tagName ?? "";
        if (tag === "STRONG" || tag === "B") continue;
        const txt = node.textContent ?? "";
        const idx = useLast ? txt.lastIndexOf(search) : txt.indexOf(search);
        if (idx !== -1) {
          if (!useLast) return { node, offset: idx };
          result = { node, offset: idx };
        }
      }
      return result;
    };

    const startResult = findText("<html>");
    const endResult   = findText("</html>", true);
    if (!startResult || !endResult) return;

    const range = document.createRange();
    range.setStart(startResult.node, startResult.offset);
    range.setEnd(endResult.node, endResult.offset + "</html>".length);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
    range.deleteContents();

    const frag = document.createDocumentFragment();
    const openTag = document.createElement("strong"); openTag.textContent = "<html>";
    frag.appendChild(openTag);
    const iframe = document.createElement("iframe");
    iframe.srcdoc = makeResizingSrcdoc(innerHtml);
    iframe.sandbox.value = "";
    iframe.style.cssText = "width:100%;height:320px;border:1px solid #e8e8e8;border-radius:4px;margin:6px 0;display:block;background:#fff;";
    frag.appendChild(iframe);
    const closeTag = document.createElement("strong"); closeTag.textContent = "</html>";
    frag.appendChild(closeTag);

    range.insertNode(frag);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  };

  const applyTitleBold = () => {
    const el = editorRef.current;
    if (!el) return;
    const raw = el.innerHTML;
    if (!raw.includes("&lt;title&gt;") || !raw.includes("&lt;/title&gt;")) return;
    if (raw.includes("<strong>&lt;title&gt;</strong>")) return;

    const boldText = (search: string, replacement: string) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let node: Text | null;
      while ((node = walker.nextNode() as Text | null)) {
        const tag = node.parentElement?.tagName ?? "";
        if (tag === "STRONG" || tag === "B") continue;
        const text = node.textContent ?? "";
        const idx = text.indexOf(search);
        if (idx === -1) continue;
        const range = document.createRange();
        range.setStart(node, idx);
        range.setEnd(node, idx + search.length);
        const sel = window.getSelection()!;
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand("insertHTML", false, replacement);
        return;
      }
    };

    boldText("<title>",  "<strong>&lt;title&gt;</strong>");
    boldText("</title>", "<strong>&lt;/title&gt;</strong>");
  };

  const insertPlainTextAtSelection = (root: HTMLElement, text: string): boolean => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer;
    if (container !== root && !root.contains(container)) return false;
    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    return true;
  };

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    const plain = e.clipboardData.getData('text/plain');
    const clipboardHtml = e.clipboardData.getData('text/html');
    const t = plain.trim();
    const editor = editorRef.current;
    if (!editor) return;
    e.preventDefault();

    const raw = editor?.innerHTML ?? '';
    const text = editor?.textContent ?? '';
    const inOpenHtmlBlock = text.includes('<html>') && !raw.includes('<strong>&lt;html&gt;</strong>');
    const isHtmlDoc =
      /^<!doctype/i.test(t) || /^<html[\s>]/i.test(t) ||
      (/<head[\s>]/i.test(t) && /<body[\s>]/i.test(t)) ||
      (/<style[\s>]/i.test(t) && /<\/style>/i.test(t));

    if (inOpenHtmlBlock || isHtmlDoc) {
      const content = plain || clipboardHtml;
      if (!content) return;
      if (!insertPlainTextAtSelection(editor, content)) {
        document.execCommand('insertText', false, content);
      }
      applyHtmlBlock();
      applyTitleBold();
      updateActiveStates();
      updatePlaceholder();
      scheduleSnapshot();
      return;
    }

    if (clipboardHtml) {
      const content = sanitizePostHtml(clipboardHtml);
      if (content) document.execCommand('insertHTML', false, content);
    } else if (plain) {
      if (!insertPlainTextAtSelection(editor, plain)) {
        document.execCommand('insertText', false, plain);
      }
    } else {
      return;
    }

    updateActiveStates();
    updatePlaceholder();
    scheduleSnapshot();
  }, []);

  const handleInput = () => {
    tryInlineMarkdown();
    applyHtmlBlock();
    applyTitleBold();
    updateActiveStates();
    updatePlaceholder();
    scheduleSnapshot();
  };

  const defaultFontSize = clampFontSize(parseInt(fontSizeInput, 10), DEFAULT_FONT_SIZE);

  // ── Render ────────────────────────────────────────────────────────────────

  const clampLeft = (left: number, popoverWidth: number) =>
    Math.max(8, Math.min(left, window.innerWidth - popoverWidth - 8));

  return (
    <div style={styles.page}>
      <header className="editor-header" style={styles.header}>
        <span style={styles.logo}>HTML Article Editor</span>
      </header>

      <main className="editor-main" style={styles.main}>
        <div className="editor-card" style={styles.card}>

          {/* Toolbar */}
          <div className="editor-toolbar" style={styles.toolbar}>
            <select style={styles.select} value={activeFont}
              onChange={(e) => handleFontChange(e.target.value)} title="Font family">
              {GOOGLE_FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <Sep />

            <select style={styles.select} value={heading}
              onChange={(e) => handleHeading(e.target.value)} title="Block type">
              {HEADINGS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>
            <Sep />

            <input type="number" min="1" max={MAX_FONT_SIZE} style={styles.sizeInput}
              value={fontSizeInput}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setFontSizeInput(isNaN(v) ? e.target.value : String(clampFontSize(v)));
              }}
              onBlur={commitFontSize}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commitFontSize(); } }}
              title="Font size (Enter to apply)" />
            <Sep />

            <Btn active={isBold}      onPress={toggleBold}      title="Bold  **text**"><strong>B</strong></Btn>
            <Btn active={isItalic}    onPress={toggleItalic}    title="Italic  *text*" style={{ fontStyle: "italic" }}>I</Btn>
            <Btn active={isUnderline} onPress={toggleUnderline} title="Underline  __text__" style={{ textDecoration: "underline" }}>U</Btn>
            <Btn active={isStrike}    onPress={toggleStrike}    title="Strikethrough  ~~text~~" style={{ textDecoration: "line-through" }}>S</Btn>
            <Sep />

            <Btn active={isCode}      onPress={toggleInlineCode} title="Inline code  `text`"><CodeInlineIcon /></Btn>
            <Btn active={isHighlight} onPress={toggleHighlight}  title="Highlight  ==text=="><HighlightIcon /></Btn>
            <Sep />

            <div ref={linkWrapRef} style={{ position: "relative" }}>
              <Btn btnRef={linkBtnRef} active={isLink} onPress={openLinkPopover} title="Insert link  [text](url)">
                <LinkIcon />
              </Btn>
              {linkPopoverOpen && (
                <LinkPopover pos={linkPopoverPos} isInLink={isLink} currentUrl={linkCurrentUrl}
                  hasSelection={linkHasSelection} onApply={applyLink} onRemove={removeLink} />
              )}
            </div>
            <Sep />

            <Btn active={isBullet}     onPress={toggleBullet}     title="Bullet list  - at line start"><BulletIcon /></Btn>
            <Btn active={isOrdered}    onPress={toggleOrdered}    title="Ordered list  1. at line start"><OrderedIcon /></Btn>
            <Sep />

            <Btn active={isBlockquote} onPress={toggleBlockquote} title="Blockquote  > at line start"><QuoteIcon /></Btn>
            <Btn active={false} onPress={() => { takeSnapshot(); exec("insertHTML", "<hr><p><br></p>"); }}
              title="Horizontal rule  ---"><HrIcon /></Btn>
            <Btn active={isCodeBlock}  onPress={toggleCodeBlock}  title="Code block  ``` + Enter"><CodeBlockIcon /></Btn>
            <Sep />

            <div ref={tableWrapRef} style={{ position: "relative" }}>
              <Btn btnRef={tableBtnRef} active={false} onPress={openPicker} title="Insert table">
                <TableIcon />
              </Btn>
              {pickerOpen && <TablePicker pos={pickerPos} onPick={insertTable} />}
            </div>
            <Sep />

            <Btn active={alignLeft}   onPress={() => setAlignment('Left')}   title="Align left"><AlignLeftIcon /></Btn>
            <Btn active={alignCenter} onPress={() => setAlignment('Center')} title="Align center"><AlignCenterIcon /></Btn>
            <Btn active={alignRight}  onPress={() => setAlignment('Right')}  title="Align right"><AlignRightIcon /></Btn>
            <Btn active={alignFull}   onPress={() => setAlignment('Full')}   title="Justify"><AlignJustifyIcon /></Btn>
            <Sep />

            <div ref={textColorWrapRef} style={{ position: "relative" }}>
              <Btn btnRef={textColorBtnRef} active={textColorOpen} onPress={openTextColorPicker} title="Text color">
                <TextColorIcon />
              </Btn>
              {textColorOpen && <ColorSwatchPicker pos={textColorPos} inputRef={textColorInputRef} onPick={applyTextColor} />}
            </div>

            <div ref={bgColorWrapRef} style={{ position: "relative" }}>
              <Btn btnRef={bgColorBtnRef} active={bgColorOpen} onPress={openBgColorPicker} title="Background color">
                <BgColorIcon />
              </Btn>
              {bgColorOpen && <ColorSwatchPicker pos={bgColorPos} inputRef={bgColorInputRef} onPick={applyBgColor} />}
            </div>
            <Sep />

            <div ref={imageWrapRef} style={{ position: "relative" }}>
              <Btn btnRef={imageBtnRef} active={false} onPress={openImagePicker} title="Insert image">
                <ImageIcon />
              </Btn>
              {imagePickerOpen && <ImagePopover pos={imagePickerPos} onInsert={insertImage} />}
            </div>
          </div>

          {/* Editable area */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="editor-area"
            style={{ ...styles.editorArea, fontSize: `${defaultFontSize}px` }}
            onBlur={saveSelection}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            onPaste={handlePaste}
            onMouseUp={updateActiveStates}
            data-placeholder="Start writing your article…"
          />

          {/* Post row */}
          <div className="post-row" style={styles.postRow}>
            {copyToast && <span style={styles.toast}>Copied!</span>}
            {toast && <span style={styles.toast}>Posted!</span>}
            <button style={styles.exportBtn} onClick={handleCopyHtml} title="Copy editor HTML to clipboard">Copy HTML</button>
            <button style={styles.exportBtn} onClick={handleDownloadHtml} title="Download as .html file">Download</button>
            <button style={styles.postBtn} onClick={handlePost} title="Publish this article to your local feed">Post</button>
          </div>
        </div>

        {/* Shortcut hints */}
        <div className="hints-section" style={styles.hints}>
          <span style={styles.hintTitle}>Shortcuts</span>
          {SHORTCUTS.map((h) => <span key={h} style={styles.hint}>{h}</span>)}
        </div>

        <PostFeed posts={posts} postsRef={postsRef} onDelete={deletePost} />
      </main>

      {tableBar && (
        <TableBar
          top={tableBar.top} left={tableBar.left} width={tableBar.width}
          onAddRowAbove={tblAddRowAbove} onAddRowBelow={tblAddRowBelow}
          onAddColLeft={tblAddColLeft}   onAddColRight={tblAddColRight}
          onDeleteRow={tblDeleteRow}     onDeleteCol={tblDeleteCol}
          onDeleteTable={tblDeleteTable}
        />
      )}
    </div>
  );
}
