import { z } from "zod";

export const createSupportMessageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  subject: z.string().trim().max(120).optional(),
});

export const updateSupportConversationSettingsSchema = z
  .object({
    status: z.enum(["open", "closed"]).optional(),
    allowUserReplies: z.boolean().optional(),
  })
  .refine(
    (value) => value.status !== undefined || value.allowUserReplies !== undefined,
    {
      message: "At least one support conversation setting must be provided.",
    },
  );

export type CreateSupportMessageInput = z.infer<typeof createSupportMessageSchema>;
export type UpdateSupportConversationSettingsInput = z.infer<
  typeof updateSupportConversationSettingsSchema
>;
