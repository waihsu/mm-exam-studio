export type AppUser = {
  id: string;
  email?: string | null;
  banned?: boolean | null;
  role?: string | null;
  accountStatus?: "active" | "suspended" | "deactivated" | null;
  accountStatusReason?: string | null;
  accountStatusChangedAt?: string | null;
  passwordResetRequiredAt?: string | null;
  [key: string]: unknown;
};

export type AppSession = Record<string, unknown>;

export type AppRole = "student" | "instructor" | "admin" | "superadmin";

type ServiceBinding = {
  fetch: (input: Request | URL | string, init?: RequestInit) => Promise<Response>;
};

type DurableObjectIdLike = unknown;

type DurableObjectStubLike = {
  fetch: (input: Request | URL | string, init?: RequestInit) => Promise<Response>;
};

type DurableObjectNamespaceLike = {
  idFromName: (name: string) => DurableObjectIdLike;
  get: (id: DurableObjectIdLike) => DurableObjectStubLike;
};

export type AppBindings = {
  Bindings: {
    [key: string]: unknown;
    MEDIA_BUCKET?: unknown;
    PDF_RENDERER?: ServiceBinding;
    PDF_RENDERER_TOKEN?: string;
    SUPPORT_CHAT_HUB?: DurableObjectNamespaceLike;
  };
  Variables: {
    user: AppUser | null;
    session: AppSession | null;
    userRoles: AppRole[];
  };
};
