import {
  listActivePushTokensForUsers,
  revokePushRegistrationsByToken,
} from "@/modules/users/services/push-registration.service";

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
};

type SendPushToUsersParams = {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";

const chunkArray = <T>(items: T[], size: number) => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const isExpoPushToken = (value: string) =>
  /^ExponentPushToken\[[^\]]+\]$/.test(value) || /^ExpoPushToken\[[^\]]+\]$/.test(value);

export const sendExpoPushToUsers = async (params: SendPushToUsersParams) => {
  const targets = await listActivePushTokensForUsers(params.userIds);
  const tokens = Array.from(
    new Set(targets.map((item) => item.pushToken.trim()).filter(isExpoPushToken)),
  );

  if (tokens.length === 0) {
    return {
      attempted: 0,
      sent: 0,
    };
  }

  const invalidTokens: string[] = [];
  let sent = 0;

  for (const chunk of chunkArray(tokens, 100)) {
    const messages: ExpoPushMessage[] = chunk.map((token) => ({
      to: token,
      title: params.title,
      body: params.body,
      data: params.data,
      sound: "default",
    }));

    const response = await fetch(EXPO_PUSH_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.warn(
        `[push] expo send failed (${response.status} ${response.statusText}) ${body}`.trim(),
      );
      continue;
    }

    const payload = (await response.json().catch(() => null)) as
      | {
          data?: Array<{
            status?: string;
            details?: { error?: string };
          }>;
        }
      | null;

    const results = Array.isArray(payload?.data) ? payload.data : [];
    for (let index = 0; index < results.length; index += 1) {
      const item = results[index];
      if (item?.status === "ok") {
        sent += 1;
        continue;
      }
      if (item?.details?.error === "DeviceNotRegistered") {
        const token = chunk[index];
        if (token) {
          invalidTokens.push(token);
        }
      }
    }
  }

  if (invalidTokens.length > 0) {
    await revokePushRegistrationsByToken(invalidTokens);
  }

  return {
    attempted: tokens.length,
    sent,
  };
};
