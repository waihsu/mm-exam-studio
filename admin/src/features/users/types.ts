export type AdminUserRole = "user" | "admin" | "superadmin";
export type AccountStatus = "active" | "suspended" | "deactivated";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "expired";
export type BillingCycle = "monthly" | "yearly" | "lifetime";
export type SupportConversationStatus = "open" | "closed";
export type AdminUserDeviceType = "mobile" | "desktop" | "unknown";

export type AdminUserDirectoryRow = {
  user: {
    id: string;
    name: string;
    email: string;
    role: AdminUserRole;
    accountStatus: AccountStatus;
    emailVerified: boolean;
    twoFactorEnabled: boolean;
    createdAt: string;
    updatedAt: string;
  };
  subscription: {
    planCode: string;
    planName: string;
    status: SubscriptionStatus;
    billingCycle: BillingCycle;
    endsAt: string | null;
    activeDeviceCount: number;
  } | null;
  support: {
    conversationId: string;
    status: SupportConversationStatus;
    allowUserReplies: boolean;
    unreadForAdminCount: number;
    lastMessageAt: string | null;
    lastMessagePreview: string | null;
  } | null;
};

export type AdminUserDirectoryFilters = {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: AdminUserRole;
  accountStatus?: AccountStatus;
};

export type PaginatedAdminUserDirectoryResult = {
  rows: AdminUserDirectoryRow[];
  total: number;
  page: number;
  pageSize: number;
};

export type AdminUserDeviceRow = {
  id: string;
  deviceType: AdminUserDeviceType;
  deviceLabel: string | null;
  userAgent: string | null;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
};

export type AdminUserDeviceListResult = {
  user: {
    id: string;
    name: string;
    email: string;
  };
  deviceLimit: number;
  activeDeviceCount: number;
  devices: AdminUserDeviceRow[];
};

export type RevokeAdminUserDeviceResult = {
  userId: string;
  deviceId: string;
  revokedAt: string;
  alreadyRevoked: boolean;
  activeDeviceCount: number;
  device: {
    label: string | null;
    type: AdminUserDeviceType;
  };
};

export type UpdateAdminUserRoleResult = {
  changed: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    role: AdminUserRole;
    updatedAt: string;
  };
};
