import { useState } from "react";
import { popoverInput, popoverApplyBtn, popoverRemoveBtn } from "./styles";

export function LinkPopover({
  pos, isInLink, currentUrl, hasSelection, onApply, onRemove,
}: {
  pos: { top: number; left: number };
  isInLink: boolean; currentUrl: string; hasSelection: boolean;
  onApply: (url: string, text?: string) => void; onRemove: () => void;
}) {
  const [url, setUrl] = useState(currentUrl);
  const [text, setText] = useState('');
  return (
    <div
      style={{
        position: 'fixed', top: pos.top, left: pos.left, zIndex: 1000,
        background: '#fff', border: '1px solid #e0e0e0', borderRadius: 6,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: 12,
        display: 'flex', flexDirection: 'column', gap: 8, minWidth: 280,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {!hasSelection && !isInLink && (
        <input type="text" placeholder="Link text" style={popoverInput}
          value={text} onChange={(e) => setText(e.target.value)} />
      )}
      <input
        autoFocus type="url" placeholder="https://…" style={popoverInput}
        value={url} onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (url) onApply(url, text || undefined); } }}
      />
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        {isInLink && (
          <button style={popoverRemoveBtn} onMouseDown={(e) => { e.preventDefault(); onRemove(); }}>Remove</button>
        )}
        <button style={popoverApplyBtn} onMouseDown={(e) => { e.preventDefault(); if (url) onApply(url, text || undefined); }}>Apply</button>
      </div>
    </div>
  );
}
