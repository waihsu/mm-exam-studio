import { HTTPException } from "hono/http-exception";
export { readPositiveNumberParam } from "@/lib/route-utils";

export const parseDateParam = (value: string | undefined, label: string) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new HTTPException(400, {
      message: `Invalid ${label} date value.`,
    });
  }

  return parsed;
};

