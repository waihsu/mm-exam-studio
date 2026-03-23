import { createFileRoute } from "@tanstack/react-router";
import { PracticeLayoutPage } from "@/features/practice/components/practice-layout-page";

export const Route = createFileRoute("/_app/practice")({
  component: PracticeLayoutPage,
});
