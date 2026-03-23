import { createFileRoute } from "@tanstack/react-router";
import { preloadMathRichTextRenderer } from "shared";
import { PracticeSessionPage } from "@/features/practice/components/practice-session-page";

export const Route = createFileRoute("/_app/practice/$sessionId")({
  loader: async () => {
    await preloadMathRichTextRenderer();
  },
  component: PracticeSessionRoutePage,
});

function PracticeSessionRoutePage() {
  const { sessionId } = Route.useParams();
  return <PracticeSessionPage sessionId={sessionId} />;
}
