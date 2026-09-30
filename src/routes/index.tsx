import { createFileRoute } from "@tanstack/react-router";
import { ShuttleBoard } from "@/components/shuttle-board";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <ShuttleBoard />;
}
