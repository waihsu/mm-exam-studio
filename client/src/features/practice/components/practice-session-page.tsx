import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { MathRichText } from "shared";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { workspaceApi } from "@/features/workspace/api/workspace-api";
import type { PracticeSessionItem } from "@/features/workspace/types";
import { usePracticeSessionDraft } from "../hooks/use-practice-session-draft";
import { parseMatchingAnswer } from "../utils/matching-answer";

export function PracticeSessionPage({ sessionId }: { sessionId: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showSubmitPrompt, setShowSubmitPrompt] = useState(false);
  const sessionQuery = useQuery({
    queryKey: ["workspace-practice-session", sessionId],
    queryFn: () => workspaceApi.getPracticeSession(sessionId),
  });
  const session = sessionQuery.data?.ok ? sessionQuery.data.data : null;
  const isCompleted = session?.status === "completed";
  const { answers, setAnswers, clearDraft } = usePracticeSessionDraft(
    sessionId,
    Boolean(isCompleted)
  );
  const submitMutation = useMutation({
    mutationFn: () => workspaceApi.submitPracticeSession(sessionId, {
      answers: Object.entries(answers).map(([itemId, answer]) => ({ itemId, answer })),
    }),
    onSuccess: async (response) => {
      if (!response.ok) return;
      clearDraft();
      await sessionQuery.refetch();
    },
  });
  useEffect(() => {
    if (session && activeIndex > session.items.length - 1) setActiveIndex(0);
  }, [activeIndex, session]);

  if (!session) {
    if (sessionQuery.data && !sessionQuery.data.ok) return <Notice tone="error">{sessionQuery.data.message}</Notice>;
    return <EmptyState title="Loading your practice session..." icon={LoaderCircle} />;
  }

  const completed = session.status === "completed";
  const currentItem = session.items[activeIndex];
  const answerState = session.items.reduce((count, item) => ((answers[item.id] ?? item.submittedAnswer ?? "").trim() ? count + 1 : count), 0);
  const currentAnswer = answers[currentItem.id] ?? currentItem.submittedAnswer ?? "";
  const progress = Math.round((answerState / session.totalQuestions) * 100);
  const isLastQuestion = activeIndex === session.items.length - 1;
  const unansweredCount = Math.max(session.totalQuestions - answerState, 0);

  const answerQuestion = (value: string) => setAnswers((current) => ({ ...current, [currentItem.id]: value }));
  const submitAnswers = () => {
    setShowSubmitPrompt(false);
    void submitMutation.mutateAsync();
  };
  const requestSubmit = () => {
    if (unansweredCount > 0) {
      setShowSubmitPrompt(true);
      return;
    }
    submitAnswers();
  };

  const renderAnswerInput = (item: PracticeSessionItem) => {
    if (item.questionType === "mcq" && item.options.length > 0) {
      return (
        <div className="grid gap-3">
          {item.options.map((option, index) => {
            const value = option.label || option.text;
            const chosen = currentAnswer === value;
            return (
              <button
                key={`${item.id}-${index}`}
                type="button"
                disabled={completed}
                onClick={() => answerQuestion(value)}
                className={`group flex items-center gap-4 rounded-xl border px-4 py-4 text-left transition ${chosen ? "border-[#48766b] bg-[#48766b] text-white shadow-[0_12px_24px_-18px_rgba(72,118,107,0.8)]" : "border-slate-200 bg-white text-slate-800 hover:border-[#7fa99d] hover:bg-[#e7efe9]/60"}`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${chosen ? "border-white/40 bg-white/15" : "border-slate-200 bg-slate-50 text-slate-500 group-hover:border-[#7fa99d]"}`}>
                  {(option.label || String.fromCharCode(65 + index)).trim()}
                </span>
                <MathRichText content={option.text} inline />
              </button>
            );
          })}
        </div>
      );
    }

    if (item.questionType === "true_false") {
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {["True", "False"].map((choice) => {
            const chosen = currentAnswer === choice;
            return <button key={choice} type="button" disabled={completed} onClick={() => answerQuestion(choice)} className={`rounded-xl border px-5 py-4 text-left font-semibold transition ${chosen ? "border-[#48766b] bg-[#48766b] text-white" : "border-slate-200 bg-white text-slate-800 hover:border-[#7fa99d] hover:bg-[#e7efe9]/60"}`}>{choice}</button>;
          })}
        </div>
      );
    }

    if (item.questionType === "matching" && item.options.length > 0) {
      const selectedPairs = parseMatchingAnswer(currentAnswer);
      const choices = item.options.map((option) => option.text.trim()).filter(Boolean);
      return (
        <div className="space-y-3">
          {item.options.map((option, index) => {
            const pairKey = (option.label || `Item ${index + 1}`).trim();
            return (
              <label key={`${item.id}-${pairKey}`} className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)] sm:items-center">
                <span className="text-sm font-semibold text-slate-800">{pairKey}</span>
                <select value={selectedPairs[pairKey] ?? ""} disabled={completed} onChange={(event) => {
                  const nextPairs = { ...selectedPairs };
                  if (event.target.value) nextPairs[pairKey] = event.target.value; else delete nextPairs[pairKey];
                  answerQuestion(Object.keys(nextPairs).length ? JSON.stringify(nextPairs) : "");
                }} className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#48766b]">
                  <option value="">Choose a match</option>
                  {choices.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
                </select>
              </label>
            );
          })}
        </div>
      );
    }

    return <input value={currentAnswer} disabled={completed} onChange={(event) => answerQuestion(event.target.value)} placeholder="Type your answer" className="h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-[#48766b] focus:ring-4 focus:ring-[#48766b]/10" />;
  };

  return (
    <div className="space-y-6 pb-4">
      <section className="relative isolate overflow-hidden rounded-[24px] bg-[#202321] px-5 py-6 text-white shadow-[0_22px_50px_-38px_rgba(32,35,33,0.76)] sm:px-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_0%,rgba(215,111,85,0.34),transparent_33%),radial-gradient(circle_at_8%_115%,rgba(127,169,157,0.22),transparent_42%)]" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/practice" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-300 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to practice</Link>
          <p className="ui-kicker mt-6 text-[#c8f27a]">{completed ? "Session complete" : "Focus session"}</p>
          <h1 className="mt-2 text-[clamp(1.7rem,3vw,2.5rem)] font-bold tracking-[-0.04em] text-white">{session.title || "Practice session"}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">{completed ? `You scored ${session.correctAnswers}/${session.totalQuestions} (${session.scorePercent ?? 0}%). Review each answer and keep the useful feedback.` : "Work through one question at a time. Answers are saved in this browser until you submit."}</p>
        </div>
        {!completed ? <Button disabled={submitMutation.isPending} onClick={requestSubmit} className="rounded-xl bg-white text-slate-950 hover:bg-[#e7efe9]">{submitMutation.isPending ? "Submitting..." : "Finish session"}</Button> : null}
        </div>
      </section>

      {submitMutation.data && !submitMutation.data.ok ? <Notice tone="error">{submitMutation.data.message}</Notice> : null}

      <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.34)]">
            <div className="flex items-end justify-between gap-3">
              <div><p className="ui-kicker text-slate-500">Session progress</p><p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">{answerState}/{session.totalQuestions}</p></div>
              <span className="text-sm font-semibold text-[#48766b]">{progress}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#48766b] transition-all" style={{ width: `${progress}%` }} /></div>
            <div className="mt-5 grid grid-cols-5 gap-2 xl:grid-cols-4">
              {session.items.map((item, index) => {
                const answered = (answers[item.id] ?? item.submittedAnswer ?? "").trim().length > 0;
                return <button key={item.id} type="button" onClick={() => setActiveIndex(index)} className={`aspect-square rounded-lg text-xs font-bold transition ${index === activeIndex ? "bg-[#48766b] text-white" : answered ? "bg-[#e7efe9] text-[#2b554d] hover:bg-[#c9dcd3]" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`} aria-label={`Open question ${index + 1}`}>{index + 1}</button>;
              })}
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">Dark: current · light: answered</p>
            {!completed ? <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">{unansweredCount === 0 ? "All answers are ready to submit." : `${unansweredCount} question${unansweredCount === 1 ? "" : "s"} still need an answer.`}</p> : null}
          </div>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.36)] sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-sm font-extrabold text-white">{String(activeIndex + 1).padStart(2, "0")}</span><span className="ui-kicker capitalize text-slate-500">{currentItem.questionType.replace("_", " ")}</span></div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{currentItem.marks} mark{currentItem.marks === 1 ? "" : "s"}</span>
          </div>
          <MathRichText content={currentItem.body} className="mt-9" textClassName="text-lg leading-8 text-slate-900 sm:text-[1.35rem]" />
          <div className="mt-9"><p className="field-label mb-3">Your answer</p>{renderAnswerInput(currentItem)}</div>

          {completed ? <div className={`mt-6 rounded-xl border p-4 text-sm ${currentItem.isCorrect ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}><p className="flex items-center gap-2 font-bold text-slate-900">{currentItem.isCorrect ? <><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Correct</> : "Review this answer"}</p><div className="mt-3 text-slate-700"><p className="font-semibold">Correct answer</p><MathRichText content={currentItem.answerText || "Not available"} className="mt-1" /></div>{currentItem.explanation ? <div className="mt-3 text-slate-700"><p className="font-semibold">Explanation</p><MathRichText content={currentItem.explanation} className="mt-1" /></div> : null}</div> : null}

          <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-5">
            <Button variant="outline" className="rounded-xl" disabled={activeIndex === 0} onClick={() => setActiveIndex((index) => index - 1)}><ChevronLeft className="h-4 w-4" /> Previous</Button>
            {isLastQuestion ? (!completed ? <Button className="rounded-xl" disabled={submitMutation.isPending} onClick={requestSubmit}>{submitMutation.isPending ? "Submitting..." : "Finish session"}</Button> : <span className="text-sm font-semibold text-slate-500">Last question</span>) : <Button className="rounded-xl" onClick={() => setActiveIndex((index) => index + 1)}>Next <ChevronRight className="h-4 w-4" /></Button>}
          </div>
        </section>
      </div>

      {showSubmitPrompt ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-4 sm:items-center" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="submit-session-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><AlertTriangle className="h-5 w-5" /></span><div><p className="ui-kicker text-amber-700">Check before submitting</p><h2 id="submit-session-title" className="mt-1 text-xl font-bold tracking-tight text-slate-950">{unansweredCount} unanswered question{unansweredCount === 1 ? "" : "s"}</h2></div></div>
            <p className="mt-4 text-sm leading-6 text-slate-600">Unanswered questions are marked incorrect after you finish. Go back to review them, or submit the answers you have now.</p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button variant="outline" className="rounded-xl" onClick={() => setShowSubmitPrompt(false)}>Keep practicing</Button><Button className="rounded-xl" disabled={submitMutation.isPending} onClick={submitAnswers}>Submit {answerState} answer{answerState === 1 ? "" : "s"}</Button></div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
