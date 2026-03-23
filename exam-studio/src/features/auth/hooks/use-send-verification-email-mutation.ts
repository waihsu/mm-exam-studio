import { useMutation } from "@tanstack/react-query";
import { sendVerificationEmail } from "../services/auth.service";

export const useSendVerificationEmailMutation = () =>
  useMutation({
    mutationFn: sendVerificationEmail,
  });
