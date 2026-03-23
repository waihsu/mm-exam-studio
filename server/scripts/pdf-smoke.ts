import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { renderQuestionPaperPdfBytes, type QuestionPaperDetail } from "../src/modules/workspace/workspace-pdf";

const samplePaper: QuestionPaperDetail = {
  id: "paper-smoke",
  title: "Grade 12 Mathematics Final Revision",
  instructions:
    "Answer all questions. Show clear working steps. Use $\\pi = 3.14$ unless otherwise stated.",
  schoolName: "MM Exam Studio Demo School",
  brandAsset: null,
  academicYear: "2025-2026",
  includeAnswerKey: true,
  status: "finalized",
  totalQuestions: 4,
  totalMarks: 11,
  exportedAt: null,
  createdAt: new Date("2026-03-19T00:00:00.000Z"),
  updatedAt: new Date("2026-03-19T00:00:00.000Z"),
  grade: { id: "grade-12", name: "Grade 12", code: "G12" },
  subject: { id: "math", name: "Mathematics", code: "MATH" },
  chapter: { id: "chapter-algebra", name: "Algebra", code: "ALG" },
  subChapter: { id: "subchapter-functions", name: "Functions", code: "FUNC" },
  teacherName: "Hsu Wai",
  items: [
    {
      id: "item-1",
      questionId: "q1",
      position: 1,
      questionCode: "QB-ALG-001",
      questionType: "mcq",
      marks: 1,
      body: "Evaluate $\\sin(30^\\circ)$.",
      answerText: null,
      options: [
        { label: "A", text: "0.5", isCorrect: true },
        { label: "B", text: "1", isCorrect: false },
        { label: "C", text: "0", isCorrect: false },
        { label: "D", text: "2", isCorrect: false },
      ],
    },
    {
      id: "item-2",
      questionId: "q2",
      position: 2,
      questionCode: "QB-ALG-002",
      questionType: "short_answer",
      marks: 2,
      body: "Solve $x^2 - 5x + 6 = 0$.",
      answerText: "x = 2, 3",
      options: [],
    },
    {
      id: "item-3",
      questionId: "q3",
      position: 3,
      questionCode: "QB-GEO-003",
      questionType: "short_answer",
      marks: 3,
      body:
        "A circle has radius $7$ cm. Find the area using $A = \\pi r^2$ and give the final answer in cm$^2$.",
      answerText: "153.86 cm^2",
      options: [],
    },
    {
      id: "item-4",
      questionId: "q4",
      position: 4,
      questionCode: "QB-MM-004",
      questionType: "short_answer",
      marks: 5,
      body:
        "ျမန္မာစာစမ်းသပ်ချက်။ If the arithmetic sequence has first term $4$ and common difference $3$, find the 10th term.",
      answerText: "31",
      options: [],
    },
  ],
};

const outputDir = join(process.cwd(), "tmp", "pdfs");
const outputPath = join(outputDir, "workspace-pdf-smoke.pdf");

await mkdir(outputDir, { recursive: true });
const bytes = await renderQuestionPaperPdfBytes(samplePaper);
await writeFile(outputPath, bytes);

console.log(outputPath);
