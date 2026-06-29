import { useState } from "react";

const GRID = 8;

export function TablePicker({
  pos, onPick,
}: { pos: { top: number; left: number }; onPick: (rows: number, cols: number) => void }) {
  const [hover, setHover] = useState({ r: 0, c: 0 });
  return (
    <div
      style={{
        position: "fixed", top: pos.top, left: pos.left, zIndex: 1000,
        background: "#fff", border: "1px solid #e0e0e0", borderRadius: 6,
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)", padding: 10,
        userSelect: "none",
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div style={{ fontSize: 11, color: "#888", marginBottom: 7, textAlign: "center", minWidth: 80 }}>
        {hover.r > 0 && hover.c > 0 ? `${hover.r} × ${hover.c} table` : "Pick a size"}
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: `repeat(${GRID}, 18px)`, gap: 2 }}
        onMouseLeave={() => setHover({ r: 0, c: 0 })}
      >
        {Array.from({ length: GRID * GRID }, (_, i) => {
          const r = Math.floor(i / GRID) + 1;
          const c = (i % GRID) + 1;
          const active = r <= hover.r && c <= hover.c;
          return (
            <div
              key={i}
              style={{
                width: 18, height: 18, borderRadius: 2, cursor: "pointer",
                border: `1px solid ${active ? "#4a9eff" : "#d8d8d8"}`,
                background: active ? "rgba(74,158,255,0.18)" : "transparent",
                transition: "background 0.06s, border-color 0.06s",
              }}
              onMouseEnter={() => setHover({ r, c })}
              onMouseDown={(e) => { e.preventDefault(); onPick(r, c); }}
            />
          );
        })}
      </div>
    </div>
  );
}
