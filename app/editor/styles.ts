import React from "react";

export const popoverInput: React.CSSProperties = {
  width: '100%', height: 28, border: '1px solid #d8d8d8', borderRadius: 4,
  fontSize: 12, padding: '0 8px', outline: 'none', fontFamily: 'inherit',
  boxSizing: 'border-box',
};

export const popoverApplyBtn: React.CSSProperties = {
  height: 28, padding: '0 12px', borderRadius: 4, border: 'none',
  background: '#1a73e8', color: '#fff', fontSize: 12, fontWeight: 600,
  cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
};

export const popoverRemoveBtn: React.CSSProperties = {
  height: 28, padding: '0 12px', borderRadius: 4, border: '1px solid #d44',
  background: 'transparent', color: '#d44', fontSize: 12, fontWeight: 500,
  cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
};

export const btn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 28, height: 28,
  borderWidth: 1, borderStyle: "solid", borderColor: "transparent",
  borderRadius: 4, background: "transparent",
  fontSize: 13, fontWeight: 400, color: "#333",
  cursor: "pointer", flexShrink: 0,
};

export const btnOn: React.CSSProperties = { background: "#d8d8d8", borderColor: "#b0b0b0" };

export const barLabel: React.CSSProperties = {
  fontSize: 10, fontWeight: 600, color: "#aaa",
  textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 2,
};

export const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh", background: "#ffffff",
    display: "flex", flexDirection: "column",
  },
  header: { padding: "20px 32px", borderBottom: "1px solid #ebebeb" },
  logo: {
    fontSize: 13, fontWeight: 300, letterSpacing: "0.04em",
    color: "#111", textTransform: "uppercase",
  },
  main: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", padding: "48px 24px 32px",
  },
  card: {
    width: "100%", maxWidth: 860,
    border: "1px solid #e0e0e0", borderRadius: 6,
    overflow: "hidden", display: "flex", flexDirection: "column",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  toolbar: {
    display: "flex", alignItems: "center", gap: 3,
    padding: "8px 12px", borderBottom: "1px solid #e8e8e8",
    background: "#fafafa", flexWrap: "wrap", rowGap: 6,
  },
  select: {
    height: 28, border: "1px solid #d8d8d8", borderRadius: 4,
    background: "#fff", fontSize: 12, fontWeight: 300, color: "#222",
    padding: "0 6px", cursor: "pointer", outline: "none", appearance: "auto",
  },
  sizeInput: {
    width: 52, height: 28, border: "1px solid #d8d8d8", borderRadius: 4,
    background: "#fff", fontSize: 12, fontWeight: 300, color: "#222",
    padding: "0 4px", outline: "none", textAlign: "center",
  },
  editorArea: {
    flex: 1, minHeight: 520, padding: "32px 40px",
    outline: "none", lineHeight: 1.7, color: "#111", overflowY: "auto",
  },
  hints: {
    marginTop: 16, display: "flex", flexWrap: "wrap",
    gap: "5px 12px", maxWidth: 860, width: "100%", padding: "0 2px",
  },
  hintTitle: {
    fontSize: 10, fontWeight: 600, color: "#aaa",
    textTransform: "uppercase", letterSpacing: "0.08em", flexBasis: "100%", marginBottom: 2,
  },
  hint: { fontSize: 11, color: "#aaa", whiteSpace: "nowrap" },
  postRow: {
    display: "flex", alignItems: "center", justifyContent: "flex-end",
    gap: 12, padding: "12px 16px 16px",
  },
  exportBtn: {
    padding: "8px 16px", borderRadius: 6, border: "1px solid #d8d8d8",
    background: "#fff", color: "#444", fontSize: 13, fontWeight: 500,
    cursor: "pointer", letterSpacing: "0.01em",
    fontFamily: "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  },
  postBtn: {
    padding: "8px 24px", borderRadius: 6, border: "none",
    background: "#1a73e8", color: "#fff", fontSize: 14, fontWeight: 600,
    cursor: "pointer", letterSpacing: "0.01em",
    fontFamily: "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  },
  toast: {
    fontSize: 12, color: "#4caf50", fontWeight: 500, letterSpacing: "0.03em",
    fontFamily: "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  },
  feed: {
    marginTop: 48, width: "100%", maxWidth: 860,
    display: "flex", flexDirection: "column", gap: 24,
  },
  feedHeader: {
    display: "flex", alignItems: "center", gap: 10,
    paddingBottom: 12, borderBottom: "1px solid #ebebeb",
  },
  feedTitle: {
    fontSize: 13, fontWeight: 300, letterSpacing: "0.04em",
    color: "#111", textTransform: "uppercase",
  },
  feedCount: {
    fontSize: 11, color: "#aaa", background: "#f0f0f0",
    borderRadius: 10, padding: "1px 7px", fontWeight: 500,
  },
  postCard: {
    border: "1px solid #e8e8e8", borderRadius: 6,
    background: "#fff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  postMeta: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 24px", borderBottom: "1px solid #f0f0f0", background: "#fafafa",
    borderRadius: "6px 6px 0 0",
  },
  postTitle: {
    fontSize: 13, fontWeight: 500, color: "#222",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 560,
  },
  postTime: { fontSize: 11, color: "#aaa", whiteSpace: "nowrap" },
  deleteBtn: {
    background: "none", border: "none", color: "#ccc",
    cursor: "pointer", fontSize: 12, padding: "2px 4px",
    fontFamily: "inherit", lineHeight: 1,
  },
  postBody: {
    padding: "24px 32px", lineHeight: 1.7, color: "#111",
    fontSize: 15, overflowX: "auto",
  },
};
