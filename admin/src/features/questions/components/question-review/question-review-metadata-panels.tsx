import type { ReactNode } from "react";
import { FlaskConical, Layers3, Sigma, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PagePanel } from "@/components/page-container";
import { Separator } from "@/components/ui/separator";
import type { QuestionRecord, QuestionVariableDefinition } from "../../types/question.type";

type QuestionReviewMetadataPanelsProps = {
  question: QuestionRecord;
  variables: QuestionVariableDefinition[];
};

export function QuestionReviewMetadataPanels({
  question,
  variables,
}: QuestionReviewMetadataPanelsProps) {
  return (
    <>
      <PagePanel className="space-y-4 bg-white/92">
        <PanelTitle icon={<Layers3 className="h-4 w-4 text-slate-500" />} title="Taxonomy" />
        <div className="space-y-3 text-sm text-slate-700">
          <MetadataValue label="Grade" value={formatTaxonomyItem(question.grade)} />
          <MetadataValue label="Subject" value={formatTaxonomyItem(question.subject)} />
          <MetadataValue
            label="Chapter"
            value={question.chapter ? formatTaxonomyItem(question.chapter) : "No chapter selected"}
          />
          <MetadataValue
            label="Sub chapter"
            value={question.subChapter ? formatTaxonomyItem(question.subChapter) : "No sub chapter selected"}
          />
        </div>
      </PagePanel>

      <PagePanel className="space-y-4 bg-white/92">
        <PanelTitle
          icon={<FlaskConical className="h-4 w-4 text-slate-500" />}
          title="Template setup"
        />
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
            <TemplateStat label="Mode" value={question.mode} className="capitalize" />
            <TemplateStat label="Marks" value={`${question.marks} mark(s)`} />
          </div>

          {variables.length ? (
            <div className="space-y-3">
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  Variables
                </p>
                <div className="space-y-2">
                  {variables.map((variable) => (
                    <div
                      key={variable.key}
                      className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{variable.key}</Badge>
                        <Badge variant="secondary">{variable.type}</Badge>
                      </div>
                      {variable.label ? (
                        <p className="mt-2 text-sm font-medium text-slate-800">{variable.label}</p>
                      ) : null}
                      {variable.type === "number" ? (
                        <p className="mt-1 text-sm text-slate-600">
                          Range: {variable.min ?? "?"} to {variable.max ?? "?"}
                          {variable.step ? ` • Step ${variable.step}` : ""}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-slate-600">
                          Choices: {(variable.choices ?? []).join(", ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
              This question does not use template variables.
            </div>
          )}

          {question.answerFormula ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sigma className="h-4 w-4 text-slate-500" />
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  Formula rule
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 font-mono text-sm text-slate-700">
                {question.answerFormula}
              </div>
            </div>
          ) : null}
        </div>
      </PagePanel>

      <PagePanel className="space-y-4 bg-white/92">
        <PanelTitle icon={<UserRound className="h-4 w-4 text-slate-500" />} title="Audit snapshot" />
        <div className="space-y-3 text-sm text-slate-700">
          <MetadataValue
            label="Author"
            value={question.creator?.name || question.creator?.email || "Unknown author"}
          />
          <MetadataValue
            label="Last reviewer"
            value={question.reviewer?.name || question.reviewer?.email || "No reviewer recorded yet"}
          />
          <MetadataValue
            label="Last reviewed"
            value={question.reviewedAt ? formatDateTime(question.reviewedAt) : "No review timestamp yet"}
          />
          <MetadataValue label="Created" value={formatDateTime(question.createdAt)} />
          <MetadataValue label="Last updated" value={formatDateTime(question.updatedAt)} />
        </div>
      </PagePanel>
    </>
  );
}

function PanelTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
    </div>
  );
}

function MetadataValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p>{value}</p>
    </div>
  );
}

function TemplateStat({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-semibold text-slate-800 ${className}`}>{value}</p>
    </div>
  );
}

function formatTaxonomyItem(item: { code: string | null; name: string }) {
  return item.code ? `${item.code} · ${item.name}` : item.name;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
