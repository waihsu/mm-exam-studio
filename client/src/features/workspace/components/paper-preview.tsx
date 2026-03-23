import { SchoolExamPaper, type SchoolExamSection } from "shared";
import type { QuestionPaperDetail } from "../types";

const mapType = (value: "mcq" | "true_false" | "short_answer" | "fill_blank" | "matching") => {
  if (value === "mcq" || value === "matching") return "mcq" as const;
  return "short" as const;
};

export function PaperPreview({ paper }: { paper: QuestionPaperDetail }) {
  const sectionsMap = new Map<string, SchoolExamSection>();

  for (const item of paper.items) {
    const key = item.questionType;
    const title =
      item.questionType === "mcq"
        ? "Multiple Choice Questions"
        : item.questionType === "true_false"
          ? "True or False Questions"
          : item.questionType === "fill_blank"
            ? "Fill in the Blank Questions"
            : item.questionType === "matching"
              ? "Matching Questions"
              : "Short Answer Questions";

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
