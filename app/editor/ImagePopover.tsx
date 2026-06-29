import { useRef, useState } from "react";
import { compressImage } from "./helpers";
import { popoverInput, popoverApplyBtn } from "./styles";

export function ImagePopover({
  pos, onInsert,
}: {
  pos: { top: number; left: number };
  onInsert: (src: string) => void;
}) {
  const [tab, setTab] = useState<'url' | 'upload'>('url');
  const [url, setUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const src = await compressImage(file);
      onInsert(src);
    } catch { /* ignore */ }
  };

  return (
    <div
      style={{
        position: 'fixed', top: pos.top, left: pos.left, zIndex: 1000,
        background: '#fff', border: '1px solid #e0e0e0', borderRadius: 6,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: 12,
        display: 'flex', flexDirection: 'column', gap: 8, minWidth: 260,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div style={{ display: 'flex', gap: 4 }}>
        {(['url', 'upload'] as const).map((t) => (
          <button
            key={t}
            style={{
              padding: '3px 10px', borderRadius: 4, border: '1px solid',
              borderColor: tab === t ? '#1a73e8' : '#d8d8d8',
              background: tab === t ? '#e8f0fe' : 'transparent',
              color: tab === t ? '#1a73e8' : '#555',
              fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            }}
            onMouseDown={(e) => { e.preventDefault(); setTab(t); }}
          >
            {t === 'url' ? 'URL' : 'Upload'}
          </button>
        ))}
      </div>
      {tab === 'url' ? (
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            autoFocus type="url" placeholder="https://…"
            style={{ ...popoverInput, flex: 1 }}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (url) onInsert(url); } }}
          />
          <button style={popoverApplyBtn} onMouseDown={(e) => { e.preventDefault(); if (url) onInsert(url); }}>Insert</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button style={popoverApplyBtn} onMouseDown={(e) => { e.preventDefault(); fileRef.current?.click(); }}>
            Choose image…
          </button>
          <span style={{ fontSize: 10, color: '#aaa' }}>Auto-compressed to JPEG · max 1200px</span>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        </div>
      )}
    </div>
  );
}
