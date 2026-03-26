import { eq } from "drizzle-orm";
import { db, user } from "@/db";

type AdminUserRole = "user" | "admin";
const toIso = (value: Date | string) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

export const updateAdminUserRole = async (params: {
  actorUserId: string;
  actorIsSuperAdmin: boolean;
  targetUserId: string;
  role: AdminUserRole;
}) => {
  if (!params.actorIsSuperAdmin) {
    throw new Error("FORBIDDEN");
  }

  if (params.actorUserId === params.targetUserId && params.role !== "admin") {
    throw new Error("SELF_DEMOTION_BLOCKED");
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, params.targetUserId),
    columns: {
      id: true,
      name: true,
      email: true,
      role: true,
      updatedAt: true,
    },
  });

  if (!existingUser) {
    throw new Error("USER_NOT_FOUND");
  }

  if (existingUser.role === "superadmin") {
    throw new Error("TARGET_SUPERADMIN_LOCKED");
  }

  if (existingUser.role === params.role) {
    return {
      changed: false,
      user: {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role as AdminUserRole,
        updatedAt: toIso(existingUser.updatedAt),
      },
    };
  }

  const [updatedUser] = await db
    .update(user)
    .set({
      role: params.role,
      updatedAt: new Date(),
    })
    .where(eq(user.id, params.targetUserId))
    .returning();

  if (!updatedUser) {
    throw new Error("USER_NOT_FOUND");
  }

  return {
    changed: true,
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role as AdminUserRole,
      updatedAt: toIso(updatedUser.updatedAt),
    },
  };
};
