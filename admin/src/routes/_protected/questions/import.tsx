import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Upload,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PagePanel } from "@/components/page-container";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { ADMIN_ROUTES } from "@/constants/routes";
import { questionApi } from "@/features/questions/api/question.api";
import {
  prepareQuestionImport,
  QUESTION_IMPORT_TEMPLATE_CSV,
} from "@/features/questions/utils/question-import";

export const Route = createFileRoute("/_protected/questions/import")({
  component: QuestionImportPage,
});

function downloadTemplate() {
  const blob = new Blob([QUESTION_IMPORT_TEMPLATE_CSV], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "question-import-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function QuestionImportPage() {
  const queryClient = useQueryClient();
  const [csvText, setCsvText] = useState("");

  const metaQuery = useQuery({
    queryKey: ["question-meta"],
    queryFn: async () => {
      const response = await questionApi.getMeta();
      if (!response.ok) {
        throw new Error(response.message);
      }
      return response.data;
    },
  });

  const prepared = useMemo(() => {
    if (!csvText.trim() || !metaQuery.data) {
      return null;
    }

    try {
      return prepareQuestionImport(csvText, metaQuery.data);
    } catch (error) {
      return {
        items: [],
        errors: [error instanceof Error ? error.message : "Could not read the CSV."],
        parsedRowCount: 0,
      };
    }
  }, [csvText, metaQuery.data]);

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!prepared?.items.length) {
        throw new Error("Add at least one valid row before importing.");
      }

      const response = await questionApi.importQuestions(prepared.items);
      if (!response.ok) {
        throw new Error(response.message);
      }

      return response.data;
    },
    onSuccess: async (result) => {
      toast.success(
        `Imported ${result.summary.succeeded} question(s)${
          result.summary.failed ? `, ${result.summary.failed} failed` : ""
        }.`,
      );
      await queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to import questions",
      );
    },
  });

  return (
    <div className="space-y-4">
      {metaQuery.error instanceof Error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Could not load taxonomy</AlertTitle>
          <AlertDescription>{metaQuery.error.message}</AlertDescription>
        </Alert>
      ) : null}

      <PagePanel className="space-y-4 bg-white/88">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-slate-500" />
            <h2 className="text-2xl font-bold text-slate-900">
              Bulk import questions
            </h2>
          </div>
          <p className="max-w-3xl text-sm leading-7 text-slate-600">
            Paste CSV content or load a CSV file, then we will validate taxonomy
            codes, JSON columns, and question rules before sending the valid rows to
            the server.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-slate-300/80 bg-white"
            onClick={downloadTemplate}
          >
            <Download className="mr-2 h-4 w-4" />
            Download template
          </Button>
          <Button asChild variant="outline" className="border-slate-300/80 bg-white">
            <Link to={ADMIN_ROUTES.questionsNew}>Create manually instead</Link>
          </Button>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800">
                Load CSV file
              </label>
              <Input
                type="file"
                accept=".csv,text/csv"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }

                  const content = await file.text();
                  setCsvText(content);
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-800">
                CSV content
              </label>
              <Textarea
                value={csvText}
                onChange={(event) => {
                  setCsvText(event.target.value);
                }}
                placeholder="Paste question import CSV content here."
                className="min-h-[340px] bg-white font-mono text-xs"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={
                  metaQuery.isLoading ||
                  importMutation.isPending ||
                  !prepared?.items.length
                }
                onClick={() => {
                  void importMutation.mutateAsync();
                }}
              >
                <Upload className="mr-2 h-4 w-4" />
                {importMutation.isPending ? "Importing..." : "Import valid rows"}
              </Button>
              {prepared ? (
                <Badge variant="outline">
                  {prepared.items.length} valid / {prepared.parsedRowCount} parsed
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <h3 className="text-sm font-semibold text-slate-900">CSV columns</h3>
              <p className="mt-2 text-xs leading-6 text-slate-600">
                Required: <code>questionCode</code>, <code>body</code>,{" "}
                <code>type</code>, <code>gradeCode</code>, <code>subjectCode</code>.
                Use <code>optionsJson</code> and <code>variablesJson</code> for JSON
                arrays. Chapters and sub chapters can be matched by code or name.
              </p>
            </div>

            {prepared?.errors.length ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Rows needing attention</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>
                    {prepared.errors.length} row(s) could not be prepared locally.
                  </p>
                  <div className="max-h-48 space-y-1 overflow-auto rounded-xl border border-red-200 bg-white/80 p-3 text-xs">
                    {prepared.errors.map((error) => (
                      <p key={error}>{error}</p>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            ) : prepared ? (
              <Alert className="border-emerald-200 bg-emerald-50/80 text-emerald-950">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Rows look ready</AlertTitle>
                <AlertDescription>
                  {prepared.items.length} valid row(s) are ready to import.
                </AlertDescription>
              </Alert>
            ) : null}

            {importMutation.data ? (
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/92 p-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Import result
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    Total {importMutation.data.summary.total}
                  </Badge>
                  <Badge>Succeeded {importMutation.data.summary.succeeded}</Badge>
                  <Badge variant="secondary">
                    Failed {importMutation.data.summary.failed}
                  </Badge>
                </div>

                {importMutation.data.failures.length ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Failed rows
                    </p>
                    <div className="max-h-48 space-y-2 overflow-auto rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-700">
                      {importMutation.data.failures.map((failure) => (
                        <div
                          key={`${failure.index}-${failure.questionCode}`}
                          className="rounded-lg border border-white/80 bg-white/90 p-2"
                        >
                          <p className="font-semibold">
                            Row {failure.index} · {failure.questionCode}
                          </p>
                          <p>{failure.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </PagePanel>
    </div>
  );
}
