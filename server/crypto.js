"use strict";
const { subtle } = require("node:crypto").webcrypto;
const crypto = require("crypto");
const cron = require("node-cron");

const setCronRotation = () => {
  let uuid = "123";
  //run at 3 in the morning
  const schedule = cron.schedule("0 3 * * *", () => {
    uuid = crypto.randomUUID();
  });
  schedule.execute(); //execute immediately
  return () => ({
    uuid,
    schedule,
  });
};
// can be arbitrary string, just needs to be the same client and server
// not senstive

const verifyKey = async (signature, publicKey, stringToSign) => {
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

const auth = (
  request,
  reply,
  getSettings,
  verifyKey,
  userObj,
  stringToSign
) => {
  const { requireAuth } = getSettings();
  if (!requireAuth) {
    return;
  }
  const authHeader = request.headers["authorization"]; //base64 string signed value
  const userId = request.headers["x-user-id"];
  if (authHeader.startsWith("Bearer ")) {
    const signature = authHeader.substring(7, authHeader.length);
    const result = verifyKey(signature, userObj[userId], stringToSign);
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

module.exports = {
  verifyKey,
  auth,
  setCronRotation,
};
