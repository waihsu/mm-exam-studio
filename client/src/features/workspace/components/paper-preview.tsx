import { SchoolExamPaper, type SchoolExamSection } from "shared";
import type { QuestionPaperDetail, WorkspaceQuestionType } from "../types";

const mapType = (value: WorkspaceQuestionType) => {
  if (value === "mcq" || value === "matching") return "mcq" as const;
  if (value === "long_answer") return "long" as const;
  return "short" as const;
};

const questionTypeTitle = (value: WorkspaceQuestionType) => {
  switch (value) {
    case "mcq":
      return "Multiple Choice Questions";
    case "true_false":
      return "True or False Questions";
    case "fill_blank":
      return "Fill in the Blank Questions";
    case "matching":
      return "Matching Questions";
    case "long_answer":
      return "Long Answer Questions";
    case "short_answer":
      return "Short Answer Questions";
  }
};

export function PaperPreview({ paper }: { paper: QuestionPaperDetail }) {
  const sectionsMap = new Map<string, SchoolExamSection>();

  for (const item of paper.items) {
    const key = item.questionType;
    const title = questionTypeTitle(item.questionType);

    const existing = sectionsMap.get(key);
    if (!existing) {
      sectionsMap.set(key, {
        id: key,
        title,
        questionType: mapType(item.questionType),
        marksPerQuestion: item.marks,
        questions: [],
      });
    }

    sectionsMap.get(key)!.questions.push({
      id: item.id,
      code: item.questionCode,
      marks: item.marks,
      text: item.body,
      type: mapType(item.questionType),
      options:
        item.questionType === "mcq" || item.questionType === "matching"
          ? item.options.map((option) => ({
              label: option.label ?? undefined,
              text: option.text,
              isCorrect: option.isCorrect,
            }))
          : undefined,
    });
  }

  return (
    <SchoolExamPaper
      schoolName={paper.schoolName || "MM Exam Studio"}
      academicYear={paper.academicYear || null}
      subject={paper.subject?.name || null}
      grade={paper.grade?.name || null}
      examTitle={paper.title}
      instructions={
        paper.instructions ||
        "Read all questions carefully. Save this page as PDF from your browser print dialog."
      }
      sections={[...sectionsMap.values()]}
      includeQuestionCode
      showAnswerKey={paper.includeAnswerKey}
      logoUrl={paper.brandAsset?.imageDataUrl || null}
      teacherSignatureName={paper.teacherName || paper.schoolName || "MM Exam Studio"}
    />
  );
}
