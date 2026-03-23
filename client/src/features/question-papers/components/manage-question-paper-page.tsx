import { QuestionPaperEditor } from "@/features/workspace/components/question-paper-editor";

export function ManageQuestionPaperPage({ paperId }: { paperId: string }) {
  return <QuestionPaperEditor paperId={paperId} />;
}
