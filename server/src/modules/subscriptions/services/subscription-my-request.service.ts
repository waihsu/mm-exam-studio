import { and, desc, eq, sql } from "drizzle-orm";
import { db, subscriptionRequest } from "@/db";
import type { CreateSubscriptionRequestInput } from "../subscription.schema";
import {
  ensureCurrentSubscription,
  getCurrentSubscriptionRequest,
} from "../core/subscription-snapshot.service";
import { mapSubscriptionRequest } from "./subscription-shared.service";

export { getCurrentSubscriptionRequest };

const normalizeTransactionId = (value: string) => value.trim().toUpperCase();

export const listOwnSubscriptionRequests = async (userId: string) => {
  const rows = await db.query.subscriptionRequest.findMany({
    where: eq(subscriptionRequest.userId, userId),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
    with: {
      reviewer: {
        columns: { id: true, name: true, email: true },
      },
    },
  });

  return {
    rows: rows.map((row) =>
      mapSubscriptionRequest(row, { includePaymentProofImage: true }),
    ),
  };
};

export const createSubscriptionRequest = async (
  userId: string,
  input: CreateSubscriptionRequestInput,
) => {
  const currentSubscription = await ensureCurrentSubscription(userId);
  const normalizedTransactionId = normalizeTransactionId(input.transactionId);

  if (currentSubscription.plan.code === input.planCode) {
    throw new Error("This account is already on the requested plan.");
  }

  const existingPending = await db.query.subscriptionRequest.findFirst({
    where: and(
      eq(subscriptionRequest.userId, userId),
      eq(subscriptionRequest.status, "pending"),
    ),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });

  if (existingPending) {
    throw new Error("A subscription request is already pending for this account.");
  }

  const [duplicateTransaction] = await db
    .select({
      id: subscriptionRequest.id,
      userId: subscriptionRequest.userId,
      status: subscriptionRequest.status,
      createdAt: subscriptionRequest.createdAt,
    })
    .from(subscriptionRequest)
    .where(sql`upper(${subscriptionRequest.transactionId}) = ${normalizedTransactionId}`)
    .orderBy(desc(subscriptionRequest.createdAt))
    .limit(1);

  if (duplicateTransaction) {
    if (duplicateTransaction.userId !== userId) {
      throw new Error("This transaction ID has already been used by another account.");
    }

    if (
      duplicateTransaction.status === "pending" ||
      duplicateTransaction.status === "approved"
    ) {
      throw new Error("This transaction ID has already been submitted.");
    }
  }

  const [created] = await db
    .insert(subscriptionRequest)
    .values({
      userId,
      requestedPlanCode: input.planCode,
      transactionId: normalizedTransactionId,
      paymentProofImageDataUrl: input.paymentProofImageDataUrl ?? null,
      note: input.note ?? null,
    })
    .returning();

  const row = await db.query.subscriptionRequest.findFirst({
    where: eq(subscriptionRequest.id, created.id),
    with: {
      reviewer: {
        columns: { id: true, name: true, email: true },
      },
    },
  });

  if (!row) {
    throw new Error("Subscription request not found after creation.");
  }

  return mapSubscriptionRequest(row, { includePaymentProofImage: true });
};

export const cancelSubscriptionRequest = async (userId: string, requestId: string) => {
  const row = await db.query.subscriptionRequest.findFirst({
    where: and(
      eq(subscriptionRequest.id, requestId),
      eq(subscriptionRequest.userId, userId),
    ),
    with: {
      reviewer: {
        columns: { id: true, name: true, email: true },
      },
    },
  });

  if (!row) {
    throw new Error("Subscription request not found.");
  }

  if (row.status !== "pending") {
    throw new Error("Only pending requests can be canceled.");
  }

  const [updated] = await db
    .update(subscriptionRequest)
    .set({
      status: "canceled",
      updatedAt: new Date(),
    })
    .where(eq(subscriptionRequest.id, row.id))
    .returning();

  return mapSubscriptionRequest(
    {
      ...row,
      ...updated,
    },
    { includePaymentProofImage: true },
  );
};
