import { connection } from "next/server";
import Editor from "./Editor";
import { ErrorBoundary } from "./editor/ErrorBoundary";

export default async function Home() {
  await connection();
  return (
    <ErrorBoundary>
      <Editor />
    </ErrorBoundary>
  );
}
