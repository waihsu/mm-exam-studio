import { useMutation } from "@tanstack/react-query";
import { requestPasswordReset } from "../services/auth.service";

export const useRequestPasswordResetMutation = () =>
  useMutation({
    mutationFn: requestPasswordReset,
  });
