import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SETTINGS_QUERY_KEYS } from "@/features/settings/constants/query-keys";
import { PRACTICE_QUERY_KEYS } from "../constants/query-keys";
import { clearPracticeDraft } from "../services/practice-draft-store";
import { clearPracticeReminderNotification } from "../services/practice-reminder-notification.service";
import { deletePracticeSession } from "../services/practice.service";

export const useDeletePracticeSessionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePracticeSession,
    onSuccess: async (_, sessionId) => {
      queryClient.removeQueries({
        queryKey: PRACTICE_QUERY_KEYS.session(sessionId),
      });
      await Promise.all([
        clearPracticeDraft(sessionId),
        clearPracticeReminderNotification(sessionId),
      ]);
      await queryClient.invalidateQueries({
        queryKey: PRACTICE_QUERY_KEYS.sessions(),
      });
      await queryClient.invalidateQueries({
        queryKey: SETTINGS_QUERY_KEYS.practiceDrafts,
      });
    },
  });
};
