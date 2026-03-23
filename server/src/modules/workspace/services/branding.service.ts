import { and, asc, count as dbCount, eq } from "drizzle-orm";
import { brandAsset, db } from "@/db";
import { getUserSubscriptionSnapshot } from "../../subscriptions/subscription.core";
import type { CreateBrandAssetInput } from "../branding.schema";

export const listBrandAssets = async (userId: string) => {
  const rows = await db.query.brandAsset.findMany({
    where: eq(brandAsset.userId, userId),
    orderBy: (table, { desc, asc: orderAsc }) => [
      desc(table.isPrimary),
      orderAsc(table.createdAt),
    ],
    columns: {
      id: true,
      label: true,
      imageDataUrl: true,
      isPrimary: true,
      createdAt: true,
    },
  });

  return { rows };
};

export const createBrandAsset = async (
  userId: string,
  input: CreateBrandAssetInput,
) => {
  const subscription = await getUserSubscriptionSnapshot(userId);
  const effectivePlan = subscription.effectivePlan ?? subscription.plan;
  const existingCount = await db
    .select({ total: dbCount() })
    .from(brandAsset)
    .where(eq(brandAsset.userId, userId))
    .then((rows) => rows[0]?.total ?? 0);

  if (effectivePlan.brandingLogoLimit <= 0) {
    throw new Error("Your current plan does not include custom logo branding.");
  }

  if (existingCount >= effectivePlan.brandingLogoLimit) {
    throw new Error("You have reached the logo storage limit for your current plan.");
  }

  const [asset] = await db
    .insert(brandAsset)
    .values({
      userId,
      label: input.label.trim(),
      imageDataUrl: input.imageDataUrl,
      isPrimary: existingCount === 0,
    })
    .returning();

  return asset;
};

export const setPrimaryBrandAsset = async (
  userId: string,
  brandAssetId: string,
) => {
  const asset = await db.query.brandAsset.findFirst({
    where: and(eq(brandAsset.id, brandAssetId), eq(brandAsset.userId, userId)),
    columns: {
      id: true,
    },
  });

  if (!asset) {
    throw new Error("Brand logo not found.");
  }

  await db
    .update(brandAsset)
    .set({ isPrimary: false, updatedAt: new Date() })
    .where(eq(brandAsset.userId, userId));

  await db
    .update(brandAsset)
    .set({ isPrimary: true, updatedAt: new Date() })
    .where(eq(brandAsset.id, asset.id));

  return listBrandAssets(userId);
};

export const deleteBrandAsset = async (userId: string, brandAssetId: string) => {
  const asset = await db.query.brandAsset.findFirst({
    where: and(eq(brandAsset.id, brandAssetId), eq(brandAsset.userId, userId)),
    columns: {
      id: true,
      isPrimary: true,
    },
  });

  if (!asset) {
    throw new Error("Brand logo not found.");
  }

  await db.delete(brandAsset).where(eq(brandAsset.id, asset.id));

  if (asset.isPrimary) {
    const nextAsset = await db.query.brandAsset.findFirst({
      where: eq(brandAsset.userId, userId),
      orderBy: (table, { asc: orderAsc }) => [orderAsc(table.createdAt)],
      columns: { id: true },
    });

    if (nextAsset) {
      await db
        .update(brandAsset)
        .set({ isPrimary: true, updatedAt: new Date() })
        .where(eq(brandAsset.id, nextAsset.id));
    }
  }

  return listBrandAssets(userId);
};

export const resolveBrandAssetForUser = async (
  userId: string,
  brandAssetId?: string | null,
) => {
  if (!brandAssetId) {
    return null;
  }

  const asset = await db.query.brandAsset.findFirst({
    where: and(eq(brandAsset.id, brandAssetId), eq(brandAsset.userId, userId)),
    columns: {
      id: true,
    },
  });

  if (!asset) {
    throw new Error("The selected logo is unavailable for this account.");
  }

  return asset.id;
};
