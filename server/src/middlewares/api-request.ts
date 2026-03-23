import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppBindings } from "../core/types/app";

const requestedWithHeader = "x-requested-with";
const requestedWithValue = "xmlhttprequest";

export const requireProgrammaticApiRequest: MiddlewareHandler<
  AppBindings
> = async (c, next) => {
  const requestedWith = c.req.header(requestedWithHeader)?.trim().toLowerCase();
  if (requestedWith !== requestedWithValue) {
    throw new HTTPException(403, {
      message: "This endpoint only accepts authenticated API requests",
    });
  }

  await next();

  c.res.headers.set("cache-control", "private, no-store, max-age=0");
  c.res.headers.set("pragma", "no-cache");
};
