import React from "react";
import { SWATCHES } from "./constants";

export function ColorSwatchPicker({
  pos, onPick, inputRef,
}: {
  pos: { top: number; left: number };
  onPick: (color: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div
      style={{
        position: 'fixed', top: pos.top, left: pos.left, zIndex: 1000,
        background: '#fff', border: '1px solid #e0e0e0', borderRadius: 6,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: 10,
        userSelect: 'none',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 22px)', gap: 3 }}>
        {SWATCHES.map((c) => (
          <div
            key={c}
            title={c}
            style={{
              width: 22, height: 22, borderRadius: 3, cursor: 'pointer',
              background: c,
              border: c === '#ffffff' ? '1px solid #d8d8d8' : '1px solid transparent',
              boxSizing: 'border-box',
            }}
            onMouseDown={(e) => { e.preventDefault(); onPick(c); }}
          />
        ))}
        <div
          title="Custom color"
          style={{
            width: 22, height: 22, borderRadius: 3, cursor: 'pointer',
            background: 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)',
            border: '1px solid transparent', boxSizing: 'border-box',
          }}
          onMouseDown={(e) => { e.preventDefault(); inputRef.current?.click(); }}
        />
      </div>
      <input
        ref={inputRef}
        type="color"
        style={{ display: 'none' }}
        onChange={(e) => onPick(e.target.value)}
      />
    </div>
  );
}
