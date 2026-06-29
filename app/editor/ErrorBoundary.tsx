"use client";

import React from "react";

interface State { error: Error | null }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", minHeight: "100vh", gap: 16,
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          color: "#444", padding: "0 24px",
        }}>
          <div style={{ fontSize: 13, fontWeight: 300, letterSpacing: "0.04em", color: "#111", textTransform: "uppercase" }}>
            HTML Article Editor
          </div>
          <div style={{ fontSize: 14, color: "#888", marginTop: 8 }}>
            Something went wrong. Your posts are safe in localStorage.
          </div>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: 8, padding: "8px 20px", borderRadius: 6,
              border: "1px solid #d8d8d8", background: "#fff",
              color: "#444", fontSize: 13, cursor: "pointer",
            }}
          >
            Try again
          </button>
          <details style={{ marginTop: 12, fontSize: 11, color: "#bbb", maxWidth: 480 }}>
            <summary style={{ cursor: "pointer" }}>Error details</summary>
            <pre style={{ marginTop: 8, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
              {this.state.error.message}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}
