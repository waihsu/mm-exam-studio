import { z } from "zod";

const dataUrlPattern = /^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/i;

export const createBrandAssetSchema = z.object({
  label: z.string().trim().min(1).max(80),
  imageDataUrl: z
    .string()
    .trim()
    .max(1_200_000)
    .refine((value) => dataUrlPattern.test(value), {
      message: "Provide a valid PNG, JPG, WEBP, or SVG image as a data URL.",
    }),
});

export const setPrimaryBrandAssetSchema = z.object({
  brandAssetId: z.string().trim().min(1),
});

export type CreateBrandAssetInput = z.infer<typeof createBrandAssetSchema>;
export type SetPrimaryBrandAssetInput = z.infer<typeof setPrimaryBrandAssetSchema>;
