import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, LoaderCircle } from "lucide-react";
import { MathRichText } from "shared";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { workspaceApi } from "@/features/workspace/api/workspace-api";
import type { PracticeSessionItem } from "@/features/workspace/types";
import { parseMatchingAnswer } from "../utils/matching-answer";
import { SessionStat } from "./practice-shared";

export function PracticeSessionPage({ sessionId }: { sessionId: string }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const sessionQuery = useQuery({
    queryKey: ["workspace-practice-session", sessionId],
    queryFn: () => workspaceApi.getPracticeSession(sessionId),
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      workspaceApi.submitPracticeSession(sessionId, {
        answers: Object.entries(answers).map(([itemId, answer]) => ({
          itemId,
          answer,
        })),
      }),
    onSuccess: () => {
      void sessionQuery.refetch();
    },
  });

  const session = sessionQuery.data?.ok ? sessionQuery.data.data : null;

  if (!session) {
    if (sessionQuery.data && !sessionQuery.data.ok) {
      return <Notice tone="error">{sessionQuery.data.message}</Notice>;
    }

    return <EmptyState title="Loading practice session..." icon={LoaderCircle} />;
  }

  const isCompleted = session.status === "completed";
  const answerState = session.items.reduce(
    (count, item) =>
      (answers[item.id] ?? item.submittedAnswer ?? "").trim().length > 0 ? count + 1 : count,
    0,
  );

  const renderAnswerInput = (item: PracticeSessionItem) => {
    if (item.questionType === "mcq" && item.options.length > 0) {
      return item.options.map((option, index) => {
        const optionValue = option.label || option.text;
        const isChosen = (answers[item.id] ?? item.submittedAnswer ?? "") === optionValue;

        return (
          <button
            key={`${item.id}-${index}`}
            type="button"
            disabled={isCompleted}
            onClick={() =>
              setAnswers((current) => ({
                ...current,
                [item.id]: optionValue,
              }))
            }
            className={`block w-full rounded-lg border px-4 py-3 text-left transition ${
              isChosen
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <span className="font-semibold">
              {(option.label || String.fromCharCode(65 + index)).trim()}.
            </span>{" "}
            <MathRichText content={option.text} inline />
          </button>
        );
      });
    }

    if (item.questionType === "true_false") {
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          {["True", "False"].map((choice) => {
            const isChosen = (answers[item.id] ?? item.submittedAnswer ?? "") === choice;

            return (
              <button
                key={`${item.id}-${choice}`}
                type="button"
                disabled={isCompleted}
                onClick={() =>
                  setAnswers((current) => ({
                    ...current,
                    [item.id]: choice,
                  }))
                }
                className={`block w-full rounded-lg border px-4 py-3 text-left transition ${
                  isChosen
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-900"
                }`}
              >
                {choice}
              </button>
            );
          })}
        </div>
      );
    }

    if (item.questionType === "matching" && item.options.length > 0) {
      const selectedPairs = parseMatchingAnswer(answers[item.id] ?? item.submittedAnswer ?? "");
      const choiceValues = item.options
        .map((option) => option.text.trim())
        .filter((value) => value.length > 0);

      return (
        <div className="space-y-3">
          {item.options.map((option, index) => {
            const pairKey = (option.label || `Item ${index + 1}`).trim();
            return (
              <div
                key={`${item.id}-match-${pairKey}-${index}`}
                className="grid gap-2 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)] sm:items-center"
              >
                <p className="text-sm font-semibold text-slate-800">{pairKey}</p>
                <select
                  value={selectedPairs[pairKey] ?? ""}
                  disabled={isCompleted}
                  onChange={(event) => {
                    const nextPairs = { ...selectedPairs };
                    const nextValue = event.target.value.trim();
                    if (!nextValue) {
                      delete nextPairs[pairKey];
                    } else {
                      nextPairs[pairKey] = nextValue;
                    }
                    setAnswers((current) => ({
                      ...current,
                      [item.id]:
                        Object.keys(nextPairs).length > 0 ? JSON.stringify(nextPairs) : "",
                    }));
                  }}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-900"
                >
                  <option value="">Select match</option>
                  {choiceValues.map((choice, choiceIndex) => (
                    <option key={`${pairKey}-${choice}-${choiceIndex}`} value={choice}>
                      {choice}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <input
        value={answers[item.id] ?? item.submittedAnswer ?? ""}
        disabled={isCompleted}
        onChange={(event) =>
          setAnswers((current) => ({
            ...current,
            [item.id]: event.target.value,
          }))
        }
        placeholder="Type your answer"
        className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-900"
      />
    );
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <section className="app-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              {session.status}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl">
              {session.title || "Practice Session"}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {session.totalQuestions} questions
              {isCompleted
                ? ` • Score ${session.correctAnswers}/${session.totalQuestions} (${session.scorePercent ?? 0}%)`
                : " • Submit when you're ready"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[session.grade?.name, session.subject?.name, session.chapter?.name, session.subChapter?.name]
                .filter(Boolean)
                .map((item) => (
                  <span
                    key={item}
                    className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                  >
                    {item}
                  </span>
                ))}
            </div>
          </div>

          <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Button asChild variant="outline" className="w-full bg-white sm:w-auto">
              <Link to="/practice">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            {!isCompleted ? (
              <Button
                className="w-full sm:w-auto"
                disabled={submitMutation.isPending}
                onClick={() => {
                  void submitMutation.mutateAsync();
                }}
              >
                {submitMutation.isPending ? "Submitting..." : "Submit answers"}
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SessionStat label="Answered" value={`${answerState}/${session.totalQuestions}`} />
        <SessionStat
          label="Correct"
          value={isCompleted ? String(session.correctAnswers) : "Pending"}
        />
        <SessionStat label="Score" value={isCompleted ? `${session.scorePercent ?? 0}%` : "Pending"} />
      </section>

      {submitMutation.data && !submitMutation.data.ok ? (
        <Notice tone="error" className="px-4 py-4">
          {submitMutation.data.message}
        </Notice>
      ) : null}

      {session.items.map((item) => (
        <section
          key={item.id}
          className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900">
              Q{item.position}. {item.questionCode}
            </p>
            <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-700">
              {item.marks} mark{item.marks > 1 ? "s" : ""}
            </span>
          </div>

          <MathRichText
            content={item.body}
            className="mt-4"
            textClassName="text-sm leading-7 text-slate-700"
          />

          <div className="mt-4 space-y-2">{renderAnswerInput(item)}</div>

          {isCompleted ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-sm">
              <p className="flex items-center gap-2 font-semibold text-slate-900">
                {item.isCorrect ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Correct
                  </>
                ) : (
                  "Needs review"
                )}
              </p>
              <div className="mt-2 text-slate-600">
                <span className="font-medium">Correct answer:</span>
                <MathRichText content={item.answerText || "Not available"} className="mt-2" />
              </div>
              {item.explanation ? (
                <div className="mt-2 text-slate-600">
                  <span className="font-medium">Explanation:</span>
                  <MathRichText content={item.explanation} className="mt-2" />
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      ))}

      {!isCompleted ? (
        <div className="sticky bottom-2 z-20 pb-[max(env(safe-area-inset-bottom),0.5rem)] sm:hidden">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Practice session
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {answerState}/{session.totalQuestions} answered
                </p>
              </div>
              <Button
                disabled={submitMutation.isPending}
                onClick={() => {
                  void submitMutation.mutateAsync();
                }}
              >
                {submitMutation.isPending ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
