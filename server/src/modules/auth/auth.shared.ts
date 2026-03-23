import { auth } from "@/lib/auth";
import { HTTPException } from "hono/http-exception";

export const toAuthHeaders = (request: Request) => new Headers(request.headers);

export const toMutableRequest = (request: Request) =>
  new Request(request, { headers: toAuthHeaders(request) });

export const requireAuthUserId = async (request: Request) => {
  const session = await auth.api.getSession({
    headers: toAuthHeaders(request),
  });
  const userId = session?.user?.id;
  if (!userId) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
  return userId;
};
