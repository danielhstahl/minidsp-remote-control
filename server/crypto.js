"use strict";
const { subtle } = require("node:crypto").webcrypto;

// can be arbitrary string, just needs to be the same client and server
// not senstive
const STRING_TO_SIGN = "0de62eb0-da02-48d0-9b5f-d4bdd6b33aa6";
const verifyKey = async (signature, publicKey) => {
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
  const encoding = enc.encode(STRING_TO_SIGN);
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

module.exports = {
  STRING_TO_SIGN,
  verifyKey,
};
