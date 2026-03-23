import { createFileRoute } from "@tanstack/react-router";
import { PracticeBuilderPage } from "@/features/practice/components/practice-builder-page";

export const Route = createFileRoute("/_app/practice/")({
  component: PracticeBuilderPage,
});
