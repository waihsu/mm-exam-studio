import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "@/components/ui/sonner";
import { ADMIN_ROUTES } from "@/constants/routes";
import { blueprintApi } from "../api/blueprint.api";
import type { PaperBlueprintSubmitInput } from "../types";
import { questionApi } from "@/features/questions/api/question.api";

export function useBlueprintBuilderData(blueprintId?: string) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(blueprintId);

  const metaQuery = useQuery({
    queryKey: ["question-meta"],
    queryFn: async () => {
      const response = await questionApi.getMeta();
      if (!response.ok) throw new Error(response.message);
      return response.data;
    },
  });

  const editingDetailQuery = useQuery({
    queryKey: ["question-blueprint-edit", blueprintId],
    queryFn: async () => {
      if (!blueprintId) throw new Error("No blueprint selected.");
      const response = await blueprintApi.getBlueprint(blueprintId);
      if (!response.ok) throw new Error(response.message);
      return response.data;
    },
    enabled: isEditing,
  });

  const saveMutation = useMutation({
    mutationFn: async (input: PaperBlueprintSubmitInput) => {
      const response = blueprintId
        ? await blueprintApi.updateBlueprint(blueprintId, input)
        : await blueprintApi.createBlueprint(input);
      if (!response.ok) throw new Error(response.message);
      return response.data;
    },
    onSuccess: async () => {
      toast.success(blueprintId ? "Blueprint updated" : "Blueprint created");
      await queryClient.invalidateQueries({ queryKey: ["question-blueprints"] });
      await queryClient.invalidateQueries({ queryKey: ["question-blueprint"] });
      await queryClient.invalidateQueries({ queryKey: ["question-blueprint-edit"] });
      await queryClient.invalidateQueries({ queryKey: ["question-blueprint-preview-summary"] });
      await navigate({ to: ADMIN_ROUTES.questionBlueprints });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to save blueprint");
    },
  });

  return { isEditing, metaQuery, editingDetailQuery, saveMutation };
}
