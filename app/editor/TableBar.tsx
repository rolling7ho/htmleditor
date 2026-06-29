import React from "react";
import { barLabel } from "./styles";

function BarBtn({
  onPress, title, danger, children,
}: { onPress: () => void; title: string; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onPress(); }}
      title={title}
      aria-label={title}
      style={{
        display: "inline-flex", alignItems: "center", gap: 2,
        padding: "2px 6px", borderRadius: 3,
        border: "1px solid transparent", background: "transparent",
        fontSize: 11, color: danger ? "#d44" : "#444",
        cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

export function TableBar({
  top, left, width,
  onAddRowAbove, onAddRowBelow, onAddColLeft, onAddColRight,
  onDeleteRow, onDeleteCol, onDeleteTable,
}: {
  top: number; left: number; width: number;
  onAddRowAbove: () => void; onAddRowBelow: () => void;
  onAddColLeft:  () => void; onAddColRight: () => void;
  onDeleteRow:   () => void; onDeleteCol:   () => void; onDeleteTable: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed", top, left, width, zIndex: 200,
        display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2,
        background: "#fff", border: "1px solid #e0e0e0", borderRadius: 5,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)", padding: "3px 6px",
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <span style={barLabel}>Row</span>
      <BarBtn onPress={onAddRowAbove} title="Add row above">↑ Above</BarBtn>
      <BarBtn onPress={onAddRowBelow} title="Add row below">↓ Below</BarBtn>
      <BarBtn onPress={onDeleteRow}   title="Delete row" danger>✕ Row</BarBtn>
      <div style={{ width: 1, height: 14, background: "#e0e0e0", margin: "0 4px" }} />
      <span style={barLabel}>Col</span>
      <BarBtn onPress={onAddColLeft}  title="Add column left">← Left</BarBtn>
      <BarBtn onPress={onAddColRight} title="Add column right">→ Right</BarBtn>
      <BarBtn onPress={onDeleteCol}   title="Delete column" danger>✕ Col</BarBtn>
      <div style={{ width: 1, height: 14, background: "#e0e0e0", margin: "0 4px" }} />
      <BarBtn onPress={onDeleteTable} title="Delete table" danger>🗑 Table</BarBtn>
    </div>
  );
}
