import { HTTPException } from "hono/http-exception";
import { auth } from "@/lib/auth";
import { writeAuditLogFromRequest } from "@/lib/audit";
import { policyMessageFor } from "@/middlewares/session-device-policy";
import {
  getAccountAccessBlock,
  getUserAccountAccessStateByEmail,
} from "@/utils/account-access";
import { signInEmailSchema } from "../auth.schema";
import { toAuthHeaders, toMutableRequest } from "../auth.shared";
import { normalizeEmail } from "../auth.utils";
import {
  canSignInFromDevice,
  findUserByEmail,
  touchSignInDeviceRegistration,
} from "./auth-sign-in-device.service";
import { assessSignInRisk } from "./auth-sign-in-risk.service";
import {
  shouldRunSignInAccountChecks,
  shouldRunSignInDeviceChecks,
  shouldWriteSignInAuditLogs,
} from "./auth-sign-in-runtime.service";

export const signInEmail = async (request: Request) => {
  const raw = (await request
    .clone()
    .json()
    .catch(() => ({}))) as Record<string, unknown>;

  const parsed = signInEmailSchema.safeParse(raw);
  if (!parsed.success) {
    throw new HTTPException(400, {
      message: "Invalid request body",
    });
  }

  const email = normalizeEmail(parsed.data.email);
  const candidateUser = await findUserByEmail(email);
  const deviceContextInput = {
    deviceId: parsed.data.deviceId,
    deviceLabel: parsed.data.deviceLabel,
    devicePlatform: parsed.data.devicePlatform,
    deviceModel: parsed.data.deviceModel,
    appVersion: parsed.data.appVersion,
    osVersion: parsed.data.osVersion,
  };
  let selectedDeviceContext:
    | Awaited<ReturnType<typeof canSignInFromDevice>>["device"]
    | null = null;

  if (shouldRunSignInAccountChecks()) {
    const state = await getUserAccountAccessStateByEmail(email);
    const block = state ? getAccountAccessBlock(state) : null;

    if (block) {
      if (shouldWriteSignInAuditLogs()) {
        const risk = await assessSignInRisk({
          request,
          email,
          userId: block.state.userId ?? candidateUser?.id,
          outcome: "blocked",
        });
        await writeAuditLogFromRequest({
          request,
          action: "auth.sign_in_blocked",
          actorUserId: block.state.userId,
          metadata: {
            reason: block.code,
            email,
            ...risk,
          },
        });
      }

      return Response.json(
        { code: block.code, message: block.message },
        { status: 403 },
      );
    }
  }

  if (shouldRunSignInDeviceChecks()) {
    const deviceAccess = await canSignInFromDevice(
      email,
      request,
      candidateUser,
      deviceContextInput,
    );
    selectedDeviceContext = deviceAccess.device;

    if (!deviceAccess.allowed) {
      if (shouldWriteSignInAuditLogs()) {
        const risk = await assessSignInRisk({
          request,
          email,
          userId: candidateUser?.id,
          outcome: "blocked",
        });
        await writeAuditLogFromRequest({
          request,
          action: "auth.device_blocked",
          actorUserId: candidateUser?.id,
          metadata: {
            email,
            deviceKey: deviceAccess.device.deviceKey,
            deviceType: deviceAccess.device.deviceType,
            deviceLabel: deviceAccess.device.deviceLabel,
            devicePlatform: deviceAccess.device.devicePlatform,
            deviceModel: deviceAccess.device.deviceModel,
            appVersion: deviceAccess.device.appVersion,
            osVersion: deviceAccess.device.osVersion,
            ...risk,
          },
        });
      }

      return Response.json(
        {
          code: "DEVICE_LIMIT",
          message: policyMessageFor(deviceAccess.deviceLimit),
        },
        { status: 403 },
      );
    }
  }

  const response = await ((auth.api as any).signInEmail
    ? (auth.api as any).signInEmail({
        body: {
          email: parsed.data.email,
          password: parsed.data.password,
          callbackURL: (raw as any).callbackURL,
          rememberMe: (raw as any).rememberMe,
        },
        headers: toAuthHeaders(request),
        asResponse: true,
      })
    : auth.handler(toMutableRequest(request)));

  const responsePayload = (await response
    .clone()
    .json()
    .catch(() => null)) as { twoFactorRedirect?: unknown } | null;
  const requiresTwoFactor = responsePayload?.twoFactorRedirect === true;
  let persistedDeviceContext: Awaited<
    ReturnType<typeof touchSignInDeviceRegistration>
  > | null = null;

  if (response.ok && !requiresTwoFactor) {
    const authenticatedUserId =
      candidateUser?.id ?? (await findUserByEmail(email))?.id ?? null;

    if (authenticatedUserId) {
      try {
        persistedDeviceContext = await touchSignInDeviceRegistration({
          userId: authenticatedUserId,
          request,
          deviceContextInput,
        });
      } catch (error) {
        console.error("[auth] device registration sync failed:", error);
      }
    }
  }

  if (shouldWriteSignInAuditLogs()) {
    const outcome: "success" | "failed" | "blocked" | "mfa" = !response.ok
      ? "failed"
      : requiresTwoFactor
        ? "mfa"
        : "success";

    const risk = await assessSignInRisk({
      request,
      email,
      userId: candidateUser?.id,
      outcome,
    });

    await writeAuditLogFromRequest({
      request,
      action: !response.ok
        ? "auth.sign_in_failed"
        : requiresTwoFactor
          ? "auth.sign_in_requires_mfa"
          : "auth.sign_in",
      actorUserId: candidateUser?.id,
      metadata: {
        email,
        status: response.status,
        deviceKey:
          persistedDeviceContext?.deviceKey ??
          selectedDeviceContext?.deviceKey ??
          null,
        deviceType:
          persistedDeviceContext?.deviceType ??
          selectedDeviceContext?.deviceType ??
          null,
        deviceLabel:
          persistedDeviceContext?.deviceLabel ??
          selectedDeviceContext?.deviceLabel ??
          null,
        devicePlatform:
          persistedDeviceContext?.devicePlatform ??
          selectedDeviceContext?.devicePlatform ??
          null,
        deviceModel:
          persistedDeviceContext?.deviceModel ??
          selectedDeviceContext?.deviceModel ??
          null,
        appVersion:
          persistedDeviceContext?.appVersion ??
          selectedDeviceContext?.appVersion ??
          null,
        osVersion:
          persistedDeviceContext?.osVersion ??
          selectedDeviceContext?.osVersion ??
          null,
        ...risk,
      },
    });
  }

  if (requiresTwoFactor && response.ok) {
    const headers = new Headers(response.headers);
    headers.set("content-type", "application/json");
    return new Response(
      JSON.stringify({
        requiresTwoFactor: true,
        challengeType: "totp_or_backup",
        message: "Two-factor verification required.",
      }),
      {
        status: 200,
        headers,
      },
    );
  }

  return response;
};
