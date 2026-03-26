import { z } from "zod";

export const registerPushTokenSchema = z.object({
  installationId: z.string().trim().min(1).max(200),
  pushToken: z.string().trim().min(1).max(500),
  platform: z.enum(["android", "ios"]),
  deviceLabel: z.string().trim().max(200).optional(),
});

export const unregisterPushTokenSchema = z.object({
  installationId: z.string().trim().min(1).max(200),
});

export const updateAdminUserRoleSchema = z.object({
  role: z.enum(["user", "admin"]),
});

export type RegisterPushTokenInput = z.infer<typeof registerPushTokenSchema>;
export type UnregisterPushTokenInput = z.infer<typeof unregisterPushTokenSchema>;
export type UpdateAdminUserRoleInput = z.infer<typeof updateAdminUserRoleSchema>;
