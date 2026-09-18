import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import { twoFactor } from "better-auth/plugins/two-factor";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { expo } from "@better-auth/expo";
import { resolveExactOrigins } from "./origin-policy";
import { hashAuthPassword, verifyAuthPassword } from "./auth-password";
import { authDb, account, session, twoFactor as twoFactorTable, user, verification } from "@/db";

const authBaseURL = (process.env.BETTER_AUTH_URL ?? "http://localhost:3000")
  .trim()
  .replace(/\/+$/, "");
const isProduction = (process.env.NODE_ENV ?? "development").trim().toLowerCase() === "production";

const authBaseOrigin = (() => {
  try {
    return new URL(authBaseURL).origin;
  } catch {
    return null;
  }
})();

const toHost = (value: string) => {
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
};

const mobileAppScheme = (process.env.AUTH_MOBILE_APP_SCHEME ?? "examstudio://").trim();

const trustedOrigins = resolveExactOrigins({
  raw:
    process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? process.env.CORS_ALLOWED_ORIGINS,
  includeDevelopmentDefaults: process.env.NODE_ENV === "development",
  extras: [mobileAppScheme, ...(authBaseOrigin ? [authBaseOrigin] : [])],
});

const dynamicBaseURLHosts = Array.from(
  new Set(
    [
      ...trustedOrigins.map((origin) => toHost(origin)).filter(Boolean),
      toHost(authBaseURL),
    ].filter((host): host is string => Boolean(host)),
  ),
);

const loggerLevel = (process.env.LOG_LEVEL ?? "info").trim().toLowerCase();
const resetPasswordWebhookUrl = (
  process.env.AUTH_RESET_PASSWORD_WEBHOOK_URL ?? ""
).trim();
const verificationWebhookUrl = (
  process.env.AUTH_EMAIL_VERIFICATION_WEBHOOK_URL ?? ""
).trim();
const resendApiKey = (process.env.RESEND_API_KEY ?? "").trim();
const resetPasswordFromEmail = (
  process.env.AUTH_RESET_PASSWORD_FROM_EMAIL ?? ""
).trim();
const resetPasswordFromName = (
  process.env.AUTH_RESET_PASSWORD_FROM_NAME ?? "Study Platform"
).trim();
const verificationFromEmail = (
  process.env.AUTH_EMAIL_VERIFICATION_FROM_EMAIL ??
  resetPasswordFromEmail
).trim();
const verificationFromName = (
  process.env.AUTH_EMAIL_VERIFICATION_FROM_NAME ??
  resetPasswordFromName
).trim();
const shouldLogResetLink =
  (
    process.env.AUTH_RESET_PASSWORD_LOG_LINK ??
    (isProduction ? "false" : "true")
  )
    .trim()
    .toLowerCase() !== "false";
const shouldLogVerificationLink =
  (
    process.env.AUTH_EMAIL_VERIFICATION_LOG_LINK ??
    (isProduction ? "false" : "true")
  )
    .trim()
    .toLowerCase() !== "false";
const twoFactorIssuer = (process.env.AUTH_MFA_ISSUER ?? "Study Platform").trim();

const maskEmail = (email: string) => {
  const normalized = email.trim().toLowerCase();
  const [namePart = "", domainPart = ""] = normalized.split("@");
  if (!namePart || !domainPart) return normalized;
  if (namePart.length <= 2) return `${namePart[0] ?? "*"}*@${domainPart}`;
  return `${namePart.slice(0, 2)}***@${domainPart}`;
};

const assertEmailDeliveryConfigured = (params: {
  kind: "password reset" | "email verification";
  viaResend: boolean;
  viaWebhook: boolean;
  allowLogOnly: boolean;
}) => {
  if (params.viaResend || params.viaWebhook || params.allowLogOnly) {
    return;
  }

  throw new Error(
    `Auth ${params.kind} delivery is not configured. Set Resend sender env vars or a webhook URL.`,
  );
};

const deliverResetPassword = async (payload: {
  user: { email?: string | null };
  url: string;
  token: string;
}) => {
  const email = String(payload.user.email ?? "")
    .trim()
    .toLowerCase();
  const maskedEmail = email ? maskEmail(email) : "unknown";

  if (shouldLogResetLink) {
    console.info(
      `[auth] password reset requested for ${maskedEmail} -> ${payload.url}`,
    );
  }

  const sendViaResend = async () => {
    if (!resendApiKey || !resetPasswordFromEmail || !email) {
      return false;
    }

    const subject = "Reset your Study Platform password";
    const text = [
      "We received a request to reset your password.",
      "",
      "Open the secure link below to set a new password:",
      payload.url,
      "",
      "If you did not request this, you can ignore this email.",
    ].join("\n");
    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <p>We received a request to reset your password.</p>
        <p>
          <a
            href="${payload.url}"
            style="display:inline-block;padding:12px 18px;border-radius:8px;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:600"
          >
            Reset Password
          </a>
        </p>
        <p style="word-break:break-all">If the button does not open, use this link:<br />${payload.url}</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `.trim();

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: `${resetPasswordFromName} <${resetPasswordFromEmail}>`,
        to: [email],
        subject,
        text,
        html,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `Resend password reset failed (${response.status} ${response.statusText}) ${body}`.trim(),
      );
    }

    return true;
  };

  const hasResendDelivery = Boolean(resendApiKey && resetPasswordFromEmail);
  const hasWebhookDelivery = Boolean(resetPasswordWebhookUrl);
  assertEmailDeliveryConfigured({
    kind: "password reset",
    viaResend: hasResendDelivery,
    viaWebhook: hasWebhookDelivery,
    allowLogOnly: !isProduction && shouldLogResetLink,
  });

  if (hasResendDelivery) {
    await sendViaResend();
    return;
  }

  if (!resetPasswordWebhookUrl) {
    return;
  }

  const response = await fetch(resetPasswordWebhookUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      type: "auth.password_reset",
      email,
      maskedEmail,
      url: payload.url,
      token: payload.token,
      issuedAt: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Password reset webhook failed (${response.status} ${response.statusText})`,
    );
  }
};

const deliverVerificationEmail = async (payload: {
  user: { email?: string | null; name?: string | null };
  url: string;
  token: string;
}) => {
  const email = String(payload.user.email ?? "")
    .trim()
    .toLowerCase();
  const maskedEmail = email ? maskEmail(email) : "unknown";
  const displayName = String(payload.user.name ?? "").trim() || "there";

  if (shouldLogVerificationLink) {
    console.info(
      `[auth] email verification requested for ${maskedEmail} -> ${payload.url}`,
    );
  }

  const sendViaResend = async () => {
    if (!resendApiKey || !verificationFromEmail || !email) {
      return false;
    }

    const subject = "Verify your Study Platform email";
    const text = [
      `Hi ${displayName},`,
      "",
      "Please verify your email address to complete your account setup.",
      "",
      payload.url,
      "",
      "If you did not create this account, you can ignore this email.",
    ].join("\n");
    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <p>Hi ${displayName},</p>
        <p>Please verify your email address to complete your account setup.</p>
        <p>
          <a
            href="${payload.url}"
            style="display:inline-block;padding:12px 18px;border-radius:8px;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:600"
          >
            Verify Email
          </a>
        </p>
        <p style="word-break:break-all">If the button does not open, use this link:<br />${payload.url}</p>
        <p>If you did not create this account, you can ignore this email.</p>
      </div>
    `.trim();

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: `${verificationFromName} <${verificationFromEmail}>`,
        to: [email],
        subject,
        text,
        html,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `Resend email verification failed (${response.status} ${response.statusText}) ${body}`.trim(),
      );
    }

    return true;
  };

  const hasResendDelivery = Boolean(resendApiKey && verificationFromEmail);
  const hasWebhookDelivery = Boolean(verificationWebhookUrl);
  assertEmailDeliveryConfigured({
    kind: "email verification",
    viaResend: hasResendDelivery,
    viaWebhook: hasWebhookDelivery,
    allowLogOnly: !isProduction && shouldLogVerificationLink,
  });

  if (hasResendDelivery) {
    await sendViaResend();
    return;
  }

  if (!verificationWebhookUrl) {
    return;
  }

  const response = await fetch(verificationWebhookUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      type: "auth.email_verification",
      email,
      maskedEmail,
      url: payload.url,
      token: payload.token,
      issuedAt: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Email verification webhook failed (${response.status} ${response.statusText})`,
    );
  }
};

export const auth = betterAuth({
  baseURL: {
    // Resolve callback origin from current request host (admin vs client),
    // while still allowing a stable fallback for non-request contexts.
    allowedHosts: dynamicBaseURLHosts,
    fallback: authBaseURL,
  },
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(authDb, {
    provider: "pg",
    camelCase: true,
    transaction: false,
    schema: {
      user,
      session,
      account,
      verification,
      twoFactor: twoFactorTable,
    },
  }),
  trustedOrigins,
  emailAndPassword: {
    enabled: true, // Enable authentication using email and password.
    autoSignIn: false,
    requireEmailVerification: true,
    password: {
      hash: hashAuthPassword,
      verify: verifyAuthPassword,
    },
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url, token }) => {
      await deliverResetPassword({ user, url, token });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: false,
    sendVerificationEmail: async ({ user, url, token }) => {
      await deliverVerificationEmail({ user, url, token });
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [
    expo(),
    bearer(),
    twoFactor({
      issuer: twoFactorIssuer || "Study Platform",
      totpOptions: {
        digits: 6,
        period: 30,
      },
      backupCodeOptions: {
        amount: 10,
        length: 10,
      },
    }),
  ],
  logger: {
    level:
      loggerLevel === "debug" ||
      loggerLevel === "error" ||
      loggerLevel === "warn"
        ? loggerLevel
        : "info",
    log(level, message, ...args) {
      console.info(level, message, ...args);
    },
  },

  account: {
    accountLinking: {
      allowDifferentEmails: true,
    },
  },
});
