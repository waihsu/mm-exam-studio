import { scrypt as nodeScrypt } from "node:crypto";
import { hex } from "@better-auth/utils/hex";
import { scryptAsync } from "@noble/hashes/scrypt.js";
import { hexToBytes } from "@noble/hashes/utils.js";

const SCRYPT_PARAMS = {
  N: 16_384,
  r: 16,
  p: 1,
  dkLen: 64,
  maxmem: 128 * 16_384 * 16 * 2,
} as const;

const normalizePassword = (value: string) => value.normalize("NFKC");

const deriveWithNodeScrypt = async (
  password: string,
  salt: string,
): Promise<Uint8Array> =>
  new Promise((resolve, reject) => {
    nodeScrypt(
      normalizePassword(password),
      salt,
      SCRYPT_PARAMS.dkLen,
      {
        N: SCRYPT_PARAMS.N,
        r: SCRYPT_PARAMS.r,
        p: SCRYPT_PARAMS.p,
        maxmem: SCRYPT_PARAMS.maxmem,
      },
      (error, derivedKey) => {
        if (error || !derivedKey) {
          reject(error ?? new Error("Failed to derive password key"));
          return;
        }

        resolve(new Uint8Array(derivedKey));
      },
    );
  });

const deriveWithNobleScrypt = async (
  password: string,
  salt: string,
): Promise<Uint8Array> =>
  scryptAsync(normalizePassword(password), salt, {
    N: SCRYPT_PARAMS.N,
    r: SCRYPT_PARAMS.r,
    p: SCRYPT_PARAMS.p,
    dkLen: SCRYPT_PARAMS.dkLen,
    maxmem: SCRYPT_PARAMS.maxmem,
  });

const deriveScryptKey = async (password: string, salt: string) => {
  try {
    return await deriveWithNodeScrypt(password, salt);
  } catch {
    return deriveWithNobleScrypt(password, salt);
  }
};

export const hashAuthPassword = async (password: string): Promise<string> => {
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  const salt = hex.encode(saltBytes);
  const key = await deriveScryptKey(password, salt);
  return `${salt}:${hex.encode(key)}`;
};

export const verifyAuthPassword = async (params: {
  hash: string;
  password: string;
}): Promise<boolean> => {
  const [salt, encodedKey] = params.hash.split(":");
  if (!salt || !encodedKey) {
    throw new Error("Invalid password hash format");
  }

  const targetKey = await deriveScryptKey(params.password, salt);
  const storedKey = hexToBytes(encodedKey);

  if (storedKey.length !== targetKey.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < storedKey.length; index += 1) {
    mismatch |= storedKey[index]! ^ targetKey[index]!;
  }
  return mismatch === 0;
};
