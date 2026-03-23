import { useMutation } from "@tanstack/react-query";
import { resetPassword } from "../services/auth.service";

export const useResetPasswordMutation = () =>
  useMutation({
    mutationFn: resetPassword,
  });
