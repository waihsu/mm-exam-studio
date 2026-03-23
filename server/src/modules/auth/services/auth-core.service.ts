import { writeAuditLogFromRequest } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { toAuthHeaders, toMutableRequest } from "../auth.shared";

export const handleAuthRequest = (request: Request) =>
  auth.handler(toMutableRequest(request));

export const signOut = async (request: Request) => {
  const headers = toAuthHeaders(request);
  const current = await auth.api.getSession({ headers });
  const response = await auth.handler(toMutableRequest(request));

  await writeAuditLogFromRequest({
    request,
    action: response.ok ? "auth.sign_out" : "auth.sign_out_failed",
    actorUserId: current?.user?.id,
    entityId: current?.session?.id,
  });

  return response;
};

export const getSession = async (request: Request) =>
  auth.api.getSession({
    headers: toAuthHeaders(request),
  });
