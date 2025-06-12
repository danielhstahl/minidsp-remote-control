import { createFastify } from "../routes.ts";
import { subtle } from "node:crypto";
import { describe, it, before, after } from "node:test";
import assert from "node:assert";
describe("api auth", () => {
  const PORT = 4001;
  const DB_NAME = ":memory:";
  let fastify;
  before(async () => {
    fastify = createFastify(DB_NAME);
    fastify.listen({ port: PORT, host: "0.0.0.0" });
  });
  after(async () => {
    await fastify.close();
  });
  it("appropriately allows me to access items if auth is off", async () => {
    const response = await fetch(`http://localhost:${PORT}/api/auth_settings`, {
      method: "POST",
      body: JSON.stringify({ requireAuth: false }),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((r) => r.json());
    const { requireAuth, stringToSign } = response;
    assert.equal(requireAuth, false);
    assert.equal(stringToSign.length > 10, true);
  });

  it("appropriately sets off and returns 403 if incorrect auth", async () => {
    const response = await fetch(`http://localhost:${PORT}/api/auth_settings`, {
      method: "POST",
      body: JSON.stringify({ requireAuth: true }),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((r) => r.json());
    const { requireAuth, stringToSign } = response;
    assert.equal(requireAuth, true);
    assert.equal(stringToSign.length > 10, true);
    const responseNoAuth = await fetch(`http://localhost:${PORT}/api/user`, {
      method: "POST",
      body: JSON.stringify({ publicKey: "somepublickey" }),
      headers: {
        "x-user-id": "2",
        authorization: "hello",
      },
    });
    assert.equal(responseNoAuth.status, 403);
  });
});

describe("api users", () => {
  const PORT = 4002;
  const DB_NAME = ":memory:";
  let fastify;
  before(async () => {
    fastify = createFastify(DB_NAME);
    fastify.listen({ port: PORT, host: "0.0.0.0" });
  });
  after(async () => {
    await fastify.close();
  });
  it("creates a user", async () => {
    const response = await fetch(`http://localhost:${PORT}/api/user`, {
      method: "POST",
      body: JSON.stringify({ publicKey: "mypublickey" }),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((r) => r.json());
    const { userId } = response;
    assert.equal(userId, "1");
  });

  it("updates user", async () => {
    const response = await fetch(`http://localhost:${PORT}/api/user/1`, {
      method: "PATCH",
      body: JSON.stringify({ publicKey: "mypublickey2" }),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((r) => r.json());
    const { userId } = response;
    assert.equal(userId, "1");
  });
});

const generateKeyPair = async () => {
  const { publicKey, privateKey } = await subtle.generateKey(
    {
      name: "RSA-PSS",
      modulusLength: 4096,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"]
  );
  return Promise.all([
    subtle
      .exportKey("spki", publicKey)
      .then(Buffer.from)
      .then((v) => v.toString("base64")),
    subtle
      .exportKey("pkcs8", privateKey)
      .then(Buffer.from)
      .then((v) => v.toString("base64")),
  ]).then(([publicKey, privateKey]) => ({ publicKey, privateKey }));
};
describe("api auth crypto", () => {
  const PORT = 4003;
  const DB_NAME = ":memory:";
  let fastify;
  before(async () => {
    fastify = createFastify(DB_NAME);
    fastify.listen({ port: PORT, host: "0.0.0.0" });
  });
  after(async () => {
    await fastify.close();
  });
  it("authenticates", async () => {
    const { publicKey, privateKey } = await generateKeyPair();
    const { userId } = await fetch(`http://localhost:${PORT}/api/user`, {
      method: "POST",
      body: JSON.stringify({ publicKey }),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((r) => r.json());
    const response = await fetch(`http://localhost:${PORT}/api/auth_settings`, {
      method: "POST",
      body: JSON.stringify({ requireAuth: true }),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((r) => r.json());
    const { requireAuth, stringToSign } = response;
    assert.equal(requireAuth, true);
    let enc = new TextEncoder();
    const thingToSign = enc.encode(stringToSign);
    assert.equal(stringToSign.length > 10, true);
    const privateKeyCrypto = await subtle.importKey(
      "pkcs8",
      Buffer.from(privateKey, "base64"),
      {
        name: "RSA-PSS",
        hash: "SHA-256",
      },
      false,
      ["sign"]
    );
    const signatureAB = await subtle.sign(
      {
        name: "RSA-PSS",
        saltLength: 32,
      },
      privateKeyCrypto,
      thingToSign
    );
    const signature = Buffer.from(signatureAB).toString("base64");

    const result = await fetch(`http://localhost:${PORT}/api/user/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ publicKey: "mypublickey" }),
      headers: {
        "x-user-id": userId,
        authorization: `Bearer ${signature}`,
        "Content-Type": "application/json",
      },
    }).then((r) => r.json());
    assert.equal(result.userId, "1");
  });
});
