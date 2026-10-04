import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ShuttleBoard } from "@/components/shuttle-board";
import { ErrorBoundary } from "@/components/error-boundary";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <ShuttleBoard />
    </ErrorBoundary>
  </StrictMode>,
);
