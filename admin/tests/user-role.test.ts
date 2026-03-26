import { describe, expect, it } from "bun:test";
import {
  canManageAdminUserRole,
  getNextAdminUserRole,
} from "../src/features/users/utils/user-role";

describe("user role helpers", () => {
  it("returns the opposite role", () => {
    expect(getNextAdminUserRole("user")).toBe("admin");
    expect(getNextAdminUserRole("admin")).toBe("user");
  });

  it("only allows superadmins to manage other users", () => {
    expect(
      canManageAdminUserRole({
        isSuperAdmin: false,
        actorUserId: "a1",
        targetUserId: "u1",
      }),
    ).toBe(false);

    expect(
      canManageAdminUserRole({
        isSuperAdmin: true,
        actorUserId: "u1",
        targetUserId: "u1",
      }),
    ).toBe(false);

    expect(
      canManageAdminUserRole({
        isSuperAdmin: true,
        actorUserId: "a1",
        targetUserId: "u1",
      }),
    ).toBe(true);
  });
});
