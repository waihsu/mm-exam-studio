import { z } from "zod";

export const signInEmailSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).optional(),
  deviceId: z
    .string()
    .trim()
    .min(8)
    .max(200)
    .regex(/^[A-Za-z0-9._-]+$/)
    .optional(),
  deviceLabel: z.string().trim().max(120).optional(),
  devicePlatform: z.enum(["android", "ios", "web", "unknown"]).optional(),
  deviceModel: z.string().trim().max(120).optional(),
  appVersion: z.string().trim().max(40).optional(),
  osVersion: z.string().trim().max(40).optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters long.")
      .max(128, "New password is too long."),
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: "New password must be different from the current password.",
    path: ["newPassword"],
  });

export type SignInEmailInput = z.infer<typeof signInEmailSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
