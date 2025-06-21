"use strict";
import { randomUUID, subtle } from "node:crypto"; //).webcrypto;
import cron from "node-cron";
export const setCronRotation = () => {
  // can be arbitrary string, just needs to be the same client and server
  // not senstive
  let uuid = "123";
  //run at 3 in the morning
  const schedule = cron.schedule(`0 3 * * *`, () => {
    uuid = randomUUID();
  });
  schedule.execute(); //execute immediately
  return () => ({
    uuid,
    schedule,
  });
};

export const verifyKey = async (
  signature: string,
  publicKey: string,
  stringToSign: string,
) => {
  const publicKeyCrypto = await subtle.importKey(
    "spki",
    Buffer.from(publicKey, "base64"),
    {
      name: "RSA-PSS",
      hash: "SHA-256",
    },
    false,
    ["verify"],
  );
  let enc = new TextEncoder();
  const encoding = enc.encode(stringToSign);
  let result = await subtle.verify(
    {
      name: "RSA-PSS",
      saltLength: 32,
    },
    publicKeyCrypto,
    Buffer.from(signature, "base64"),
    encoding,
  );
  return result;
};

interface AuthStrategy {
  isAuthenticated: boolean;
  description: string;
}
// start auth strategies
export const noAuthStrategy = async (
  getSettings: () => { requireAuth: boolean },
): Promise<AuthStrategy> => {
  const { requireAuth } = getSettings();
  return {
    isAuthenticated: !requireAuth,
    description: requireAuth
      ? "Auth required"
      : "No auth required, access is permitted",
  }; //return true if no auth required
};
export const privateKeyStrategy = async (
  authHeader: string,
  publicKey: string,
  stringToSign: string,
  verifyKeyInput: (
    v1: string,
    v2: string,
    v3: string,
  ) => Promise<boolean> = verifyKey,
): Promise<AuthStrategy> => {
  if (authHeader.startsWith("Bearer ")) {
    const signature = authHeader.substring(7, authHeader.length);
    const result = await verifyKeyInput(signature, publicKey, stringToSign);
    return {
      isAuthenticated: result,
      description: !result
        ? "Authentication Failed"
        : "Authentication succeeded with private key strategy",
    };
  } else {
    return {
      isAuthenticated: false,
      description: "Bearer token not properly formatted",
    };
  }
};
export const basicAuthStrategy = async (
  authHeader: string,
  compareToken: string,
) => {
  if (authHeader.startsWith("Basic ")) {
    const basicToken = Buffer.from(authHeader.substring(6), "base64")
      .toString()
      .substring(1); //remove initial ":"
    const isAuthenticated = compareToken === basicToken;
    return {
      isAuthenticated,
      description: !isAuthenticated
        ? "Authentication Failed"
        : "Authentication succeeded with API Key",
    };
  } else {
    return {
      isAuthenticated: false,
      description: "Basic token not properly formatted",
    };
  }
};