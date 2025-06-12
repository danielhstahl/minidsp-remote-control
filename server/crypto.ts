"use strict";
import { randomUUID, subtle } from "node:crypto"; //).webcrypto;
import cron from "node-cron";
import type { FastifyRequest, FastifyReply } from "fastify";
interface Headers {
  "x-user-id": string;
  authorization: string;
}
export const setCronRotation = () => {
  // can be arbitrary string, just needs to be the same client and server
  // not senstive
  let uuid = "123";
  //run at 3 in the morning
  const schedule = cron.schedule("0 3 * * *", () => {
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
  stringToSign: string
) => {
  const publicKeyCrypto = await subtle.importKey(
    "spki",
    Buffer.from(publicKey, "base64"),
    {
      name: "RSA-PSS",
      hash: "SHA-256",
    },
    false,
    ["verify"]
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
    encoding
  );
  return result;
};

export const auth = async (
  request: FastifyRequest<{ Headers: Headers }>,
  reply: FastifyReply,
  getSettings: () => { requireAuth: boolean },
  verifyKey: (v1: string, v2: string, v3: string) => Promise<boolean>,
  userObj: { [key: string]: string },
  stringToSign: string
) => {
  const { requireAuth } = getSettings();
  if (!requireAuth) {
    return;
  }
  const authHeader = request.headers["authorization"]; //base64 string signed value
  const userId = request.headers["x-user-id"];
  if (authHeader.startsWith("Bearer ")) {
    const signature = authHeader.substring(7, authHeader.length);
    const result = await verifyKey(signature, userObj[userId], stringToSign);
    if (result) {
      return; //keep going
    } else {
      reply.code(403);
      reply.send("Authentication Failed");
    }
  } else {
    reply.code(403);
    reply.send("Bearer token not properly formatted");
  }
};
