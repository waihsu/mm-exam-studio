import { isCloudflareWorkerRuntime } from "@/lib/runtime";

const isEnabled = (value: string | undefined, fallback: boolean) => {
  if (value == null) return fallback;
  const normalized = value.trim().toLowerCase();
  return !["0", "false", "no", "off"].includes(normalized);
};

export const shouldRunSignInAccountChecks = () =>
  isEnabled(
    process.env.AUTH_SIGN_IN_ACCOUNT_CHECKS_ENABLED,
    !isCloudflareWorkerRuntime(),
  );

export const shouldRunSignInDeviceChecks = () =>
  isEnabled(
    process.env.AUTH_SIGN_IN_DEVICE_CHECKS_ENABLED,
    !isCloudflareWorkerRuntime(),
  );

export const shouldWriteSignInAuditLogs = () =>
  isEnabled(
    process.env.AUTH_SIGN_IN_AUDIT_ENABLED,
    !isCloudflareWorkerRuntime(),
  );
