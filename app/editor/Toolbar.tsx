import React from "react";
import { btn, btnOn } from "./styles";

export function Sep() {
  return <div style={{ width: 1, height: 18, background: "#e0e0e0", margin: "0 3px", flexShrink: 0 }} />;
}

export function Btn({
  active, onPress, title, style: extra, children, btnRef,
}: {
  active: boolean; onPress: () => void; title: string;
  style?: React.CSSProperties; children: React.ReactNode;
  btnRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  return (
    <button
      ref={btnRef}
      style={{ ...btn, ...(active ? btnOn : {}), ...extra }}
      onMouseDown={(e) => { e.preventDefault(); onPress(); }}
      title={title}
      aria-label={title}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}
