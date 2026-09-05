import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/sonner";
import { questionApi } from "@/features/questions/api/question.api";
import { QuestionImportWorkspace } from "@/features/questions/components/question-import-workspace";
import {
  prepareQuestionImport,
  QUESTION_IMPORT_TEMPLATE_CSV,
} from "@/features/questions/utils/question-import";

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

export function QuestionImportPage() {
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
        notices: [],
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

      <QuestionImportWorkspace
        csvText={csvText}
        prepared={prepared}
        result={importMutation.data}
        isLoadingTaxonomy={metaQuery.isLoading}
        isImporting={importMutation.isPending}
        onDownloadTemplate={downloadTemplate}
        onCsvTextChange={setCsvText}
        onLoadFile={(file) => {
          void file.text().then(setCsvText);
        }}
        onImport={() => {
          void importMutation.mutateAsync();
        }}
      />
    </div>
  );
}
