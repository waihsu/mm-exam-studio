import type { ReactNode } from "react"
import { MathRichText } from "../math"

export type SchoolExamOption = {
  id?: string
  label?: string
  text: string
  isCorrect?: boolean
}

export type SchoolExamQuestion = {
  id?: string
  code?: string
  marks: number
  text: string | ReactNode
  type: "mcq" | "short" | "long"
  options?: SchoolExamOption[]
}

export type SchoolExamSection = {
  id?: string
  title: string
  questionType: "mcq" | "short" | "long"
  marksPerQuestion: number
  questions: SchoolExamQuestion[]
}

export type SchoolExamPaperProps = {
  schoolName: string
  logoUrl?: string | null
  academicYear?: string | null
  subject?: string | null
  grade?: string | null
  examTitle: string
  instructions?: string | null
  sections: SchoolExamSection[]
  watermarkText?: string | null
  confidential?: boolean
  includeQuestionCode?: boolean
  showAnswerKey?: boolean
  teacherSignatureName?: string | null
}

const styles = `
@page {
  size: A4;
  margin: 16mm 14mm 18mm 14mm;
}
.school-exam-paper {
  font-family:
    "Noto Sans Math",
    "STIX Two Math",
    "Cambria Math",
    "Noto Sans Myanmar",
    "Noto Serif Myanmar",
    "Times New Roman",
    "Myanmar Text",
    serif;
  color: #0f172a;
  position: relative;
}
.school-exam-paper__header {
  border-bottom: 1px solid #cbd5e1;
  padding-bottom: 10px;
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.school-exam-paper__brand {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.school-exam-paper__logo {
  width: 44px;
  height: 44px;
  object-fit: contain;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
}
.school-exam-paper__title {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
}
.school-exam-paper__meta {
  margin: 4px 0 0;
  font-size: 13px;
  color: #334155;
}
.school-exam-paper__instructions {
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 12px;
  page-break-inside: avoid;
  break-inside: avoid-page;
}
.school-exam-paper__section {
  margin-bottom: 14px;
}
.school-exam-paper__section-header {
  border-bottom: 1px dashed #cbd5e1;
  padding-bottom: 4px;
  margin-bottom: 8px;
}
.school-exam-paper__question {
  page-break-inside: avoid;
  break-inside: avoid-page;
  margin-bottom: 12px;
}
.school-exam-paper__question-title {
  margin: 0;
  font-size: 18px;
}
.school-exam-paper__question-body {
  margin-top: 6px;
  line-height: 1.45;
}
.school-exam-paper__options {
  margin: 8px 0 0 20px;
  padding-left: 12px;
}
.school-exam-paper__option-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.school-exam-paper__option-label {
  min-width: 22px;
  font-weight: 600;
}
.school-exam-paper__watermark {
  position: fixed;
  top: 40%;
  left: 15%;
  transform: rotate(-28deg);
  font-size: 64px;
  letter-spacing: 4px;
  color: rgba(15, 23, 42, 0.08);
  pointer-events: none;
  user-select: none;
}
.school-exam-paper__signature {
  margin-top: 20px;
  font-size: 14px;
  color: #334155;
}
`

export function SchoolExamPaper(props: SchoolExamPaperProps) {
  const {
    schoolName,
    logoUrl,
    academicYear,
    subject,
    grade,
    examTitle,
    instructions,
    sections,
    watermarkText,
    confidential = false,
    includeQuestionCode = true,
    showAnswerKey = false,
    teacherSignatureName,
  } = props

  const effectiveWatermark =
    confidential && (!watermarkText || watermarkText.trim().length === 0)
      ? "CONFIDENTIAL"
      : watermarkText

  const meta = [subject ? `Subject: ${subject}` : null, grade ? `Grade: ${grade}` : null, academicYear ? `Year: ${academicYear}` : null]
    .filter(Boolean)
    .join(" | ")

  const allQuestions = sections.flatMap((section) => section.questions)
  const answerKey = allQuestions
    .map((question, index) => {
      const labels = (question.options ?? [])
        .filter((option) => option.isCorrect)
        .map((option) => option.label?.trim() || option.text)
      return {
        index: index + 1,
        answer: labels.length > 0 ? labels.join(", ") : "-",
      }
    })
    .filter((entry) => entry.answer !== "-")

  let globalQuestionNumber = 1

  return (
    <article className="school-exam-paper">
      <style>{styles}</style>
      {effectiveWatermark ? <div className="school-exam-paper__watermark">{effectiveWatermark}</div> : null}

      <header className="school-exam-paper__header">
        <div className="school-exam-paper__brand">
          {logoUrl ? <img className="school-exam-paper__logo" src={logoUrl} alt="school logo" /> : null}
          <div>
            <strong>{schoolName}</strong>
            <h1 className="school-exam-paper__title">{examTitle}</h1>
            {meta ? <p className="school-exam-paper__meta">{meta}</p> : null}
          </div>
        </div>
      </header>

      <section className="school-exam-paper__instructions">
        <strong>Instructions</strong>
        <div>
          <MathRichText content={instructions || "Read all questions carefully before answering."} />
        </div>
      </section>

      {sections.map((section, sectionIndex) => (
        <section key={section.id || `${section.title}-${sectionIndex}`} className="school-exam-paper__section">
          <header className="school-exam-paper__section-header">
            <h2>
              Section {sectionIndex + 1}: {section.title}
            </h2>
          </header>

          {section.questions.map((question, questionIndex) => {
            const qNumber = globalQuestionNumber
            globalQuestionNumber += 1
            return (
              <article
                key={question.id || `${section.id || sectionIndex}-${questionIndex}`}
                className="school-exam-paper__question"
              >
                <h3 className="school-exam-paper__question-title">
                  Q{qNumber}. [{question.marks} mark{question.marks > 1 ? "s" : ""}]
                  {includeQuestionCode && question.code ? ` ${question.code}` : ""}
                </h3>
                <div className="school-exam-paper__question-body">
                  {typeof question.text === "string" ? (
                    <MathRichText content={question.text} />
                  ) : (
                    question.text
                  )}
                </div>
                {question.type === "mcq" && (question.options?.length ?? 0) > 0 ? (
                  <ol className="school-exam-paper__options" type="A">
                    {question.options!.map((option, optionIndex) => (
                      <li
                        key={option.id || `${qNumber}-option-${optionIndex}`}
                        className="school-exam-paper__option-item"
                      >
                        <span className="school-exam-paper__option-label">
                          {(option.label?.trim() || String.fromCharCode(65 + optionIndex)).replace(/\.$/, "")}.
                        </span>
                        <MathRichText content={option.text} inline />
                      </li>
                    ))}
                  </ol>
                ) : null}
              </article>
            )
          })}
        </section>
      ))}

      {showAnswerKey && answerKey.length > 0 ? (
        <section className="school-exam-paper__section">
          <header className="school-exam-paper__section-header">
            <h2>Answer Key</h2>
          </header>
          <ol>
            {answerKey.map((entry) => (
              <li key={`answer-${entry.index}`}>
                Q{entry.index}: {entry.answer}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {teacherSignatureName ? (
        <footer className="school-exam-paper__signature">
          Teacher Signature: ____________________ ({teacherSignatureName})
        </footer>
      ) : null}
    </article>
  )
}
