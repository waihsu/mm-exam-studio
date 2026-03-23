import { drizzle as drizzlePgProxy } from "drizzle-orm/pg-proxy";
import type { RemoteCallback } from "drizzle-orm/pg-proxy";
import type { DbState } from "./db-state";
import { schema } from "../schema";

type NeonHttpField = {
  name: string;
  dataTypeID?: number;
};

type NeonHttpResult = {
  fields: NeonHttpField[];
  rows: unknown[][];
};

type NeonHttpSuccess = NeonHttpResult | { results: NeonHttpResult[] };

const shouldUseInsecureHttp = (hostname: string) =>
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname === "::1" ||
  hostname.endsWith(".local");

const resolveNeonFetchEndpoint = (connectionString: string) => {
  const parsed = new URL(connectionString);
  const protocol = shouldUseInsecureHttp(parsed.hostname) ? "http" : "https";
  return `${protocol}://${parsed.host}/sql`;
};

const toHex = (input: Uint8Array) =>
  Array.from(input, (byte) => byte.toString(16).padStart(2, "0")).join("");

const normalizeBinaryToHex = (value: unknown): string | null => {
  if (value instanceof Uint8Array) {
    return `\\x${toHex(value)}`;
  }
  if (ArrayBuffer.isView(value)) {
    return `\\x${toHex(
      new Uint8Array(value.buffer, value.byteOffset, value.byteLength),
    )}`;
  }
  if (value instanceof ArrayBuffer) {
    return `\\x${toHex(new Uint8Array(value))}`;
  }
  return null;
};

const escapeArrayValue = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

const toPostgresArrayLiteral = (input: unknown[]): string =>
  `{${input.map(toPostgresArrayElement).join(",")}}`;

const toPostgresArrayElement = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "NULL";
  }
  if (Array.isArray(value)) {
    return toPostgresArrayLiteral(value);
  }

  const asHex = normalizeBinaryToHex(value);
  if (asHex) {
    return `"${escapeArrayValue(asHex)}"`;
  }

  if (value instanceof Date) {
    return `"${escapeArrayValue(value.toISOString())}"`;
  }

  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "object") {
    return `"${escapeArrayValue(JSON.stringify(value))}"`;
  }

  return `"${escapeArrayValue(String(value))}"`;
};

const normalizeParamValue = (value: unknown): unknown => {
  if (value === undefined) {
    return null;
  }
  if (value === null) {
    return null;
  }

  const asHex = normalizeBinaryToHex(value);
  if (asHex) {
    return asHex;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return toPostgresArrayLiteral(value);
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return value;
};

const parseNeonRawValue = (value: unknown, dataTypeID?: number): unknown => {
  if (value === null || typeof value !== "string") {
    return value;
  }

  switch (dataTypeID) {
    case 16:
      return value === "t";
    case 21:
    case 23:
    case 26:
    case 700:
    case 701: {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? value : parsed;
    }
    case 114:
    case 3802:
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    default:
      return value;
  }
};

const mapNeonRowsToArrays = (result: NeonHttpResult) =>
  result.rows.map((row) =>
    row.map((value, index) => {
      const field = result.fields[index];
      return parseNeonRawValue(value, field?.dataTypeID);
    }),
  );

const createNeonHttpProxyClient = (connectionString: string): RemoteCallback => {
  const endpoint = resolveNeonFetchEndpoint(connectionString);

  return async (query, params) => {
    const normalizedParams = params ?? [];

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Neon-Connection-String": connectionString,
        "Neon-Raw-Text-Output": "true",
        "Neon-Array-Mode": "true",
      },
      body: JSON.stringify({
        query,
        params: normalizedParams.map(normalizeParamValue),
      }),
    });

    if (!response.ok) {
      if (response.status === 400) {
        const parsed = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(
          parsed?.message ??
            `Neon SQL request failed with status ${response.status}`,
        );
      }

      const text = await response.text().catch(() => "");
      throw new Error(
        `Neon SQL request failed with status ${response.status}: ${text}`.trim(),
      );
    }

    const payload = (await response.json()) as NeonHttpSuccess;
    const result =
      "results" in payload
        ? payload.results[0] ?? { fields: [], rows: [] }
        : payload;

    return {
      rows: mapNeonRowsToArrays(result),
    };
  };
};

export const createNeonHttpDbState = (databaseUrl: string): DbState => {
  const neonClient = createNeonHttpProxyClient(databaseUrl);
  const authDb = drizzlePgProxy(neonClient, { schema });

  return {
    authDb,
    db: authDb,
    authSqlClient: neonClient,
    closeAuthDb: async () => {},
  };
};
