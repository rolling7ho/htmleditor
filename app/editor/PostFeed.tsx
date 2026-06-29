import React from "react";
import { Post } from "./types";
import { timeAgo } from "./helpers";
import { styles } from "./styles";

export function PostFeed({
  posts, postsRef, onDelete,
}: {
  posts: Post[];
  postsRef: React.RefObject<HTMLDivElement | null>;
  onDelete: (id: string) => void;
}) {
  if (posts.length === 0) return null;
  return (
    <div ref={postsRef} className="post-feed" style={styles.feed}>
      <div style={styles.feedHeader}>
        <span style={styles.feedTitle}>Your Posts</span>
        <span style={styles.feedCount}>{posts.length}</span>
      </div>
      {posts.map((post) => (
        <article key={post.id} style={styles.postCard}>
          <div className="post-meta" style={styles.postMeta}>
            <span className="post-title" style={styles.postTitle}>{post.title}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={styles.postTime}>{timeAgo(post.createdAt)}</span>
              <button
                style={styles.deleteBtn}
                onClick={() => onDelete(post.id)}
                title="Delete post"
                aria-label="Delete post"
              >
                ✕
              </button>
            </div>
          </div>
          {/* html is DOMPurify-sanitized before it reaches this point */}
          <div
            className="post-content post-body"
            style={styles.postBody}
            dangerouslySetInnerHTML={{ __html: post.html }}
          />
        </article>
      ))}
    </div>
  );
}
