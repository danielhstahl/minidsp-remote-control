const { createFastify } = require("../routes");
const fs = require("fs");
const { subtle } = require("node:crypto").webcrypto;
const removeAll = (databaseName) => {
  //remove SQLite database if exists
  try {
    fs.unlinkSync(databaseName);
  } catch (err) {
    console.error("An error occurred:", err);
  }
};

describe("api auth", () => {
  const PORT = 4001;
  const DB_NAME = "apiauthsuite";
  let fastify;
  beforeAll(async () => {
    removeAll(DB_NAME);
    fastify = createFastify(DB_NAME);
    fastify.listen({ port: PORT, host: "0.0.0.0" });
  });
  afterAll(async () => {
    await fastify.close();
    removeAll(DB_NAME);
  });
  test("it appropriately allows me to access items if auth is off", async () => {
    const response = await fetch(`http://localhost:${PORT}/api/auth_settings`, {
      method: "POST",
      body: JSON.stringify({ requireAuth: false }),
    }).then((r) => r.json());
    const { requireAuth, stringToSign } = response;
    expect(requireAuth).toEqual(false);
    expect(stringToSign.length).toBeGreaterThan(10);
  });

  test("it appropriately sets off and returns 403 if incorrect auth", async () => {
    const response = await fetch(`http://localhost:${PORT}/api/auth_settings`, {
      method: "POST",
      body: JSON.stringify({ requireAuth: true }),
    }).then((r) => r.json());
    const { requireAuth, stringToSign } = response;
    expect(requireAuth).toEqual(true);
    expect(stringToSign.length).toBeGreaterThan(10);
    const responseNoAuth = await fetch(`http://localhost:${PORT}/api/user`, {
      method: "POST",
      body: JSON.stringify({ publicKey: "somepublickey" }),
      headers: {
        "x-user-id": "2",
        authorization: "hello",
      },
    });
    expect(responseNoAuth.status).toBe(403);
  });
});

describe("api users", () => {
  const PORT = 4002;
  const DB_NAME = "apiusersuite";
  let fastify;
  beforeAll(async () => {
    removeAll(DB_NAME);
    fastify = createFastify(DB_NAME);
    fastify.listen({ port: PORT, host: "0.0.0.0" });
  });
  afterAll(async () => {
    await fastify.close();
    removeAll(DB_NAME);
  });
  test("it creates a user", async () => {
    const response = await fetch(`http://localhost:${PORT}/api/user`, {
      method: "POST",
      body: JSON.stringify({ publicKey: "mypublickey" }),
    }).then((r) => r.json());
    const { userId } = response;
    expect(userId).toEqual("1");
  });

  test("it updates user", async () => {
    const response = await fetch(`http://localhost:${PORT}/api/user/1`, {
      method: "PATCH",
      body: JSON.stringify({ publicKey: "mypublickey2" }),
    }).then((r) => r.json());
    const { userId } = response;
    expect(userId).toEqual("1");
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
  const DB_NAME = "apicryptosuite";
  let fastify;
  beforeAll(async () => {
    removeAll(DB_NAME);
    fastify = createFastify(DB_NAME);
    fastify.listen({ port: PORT, host: "0.0.0.0" });
  });
  afterAll(async () => {
    await fastify.close();
    removeAll(DB_NAME);
  });
  test("it authenticates", async () => {
    const { publicKey, privateKey } = await generateKeyPair();
    const { userId } = await fetch(`http://localhost:${PORT}/api/user`, {
      method: "POST",
      body: JSON.stringify({ publicKey }),
    }).then((r) => r.json());
    const response = await fetch(`http://localhost:${PORT}/api/auth_settings`, {
      method: "POST",
      body: JSON.stringify({ requireAuth: true }),
    }).then((r) => r.json());
    const { requireAuth, stringToSign } = response;
    expect(requireAuth).toEqual(true);
    let enc = new TextEncoder();
    const thingToSign = enc.encode(stringToSign);
    expect(stringToSign.length).toBeGreaterThan(10);
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
    const signature = (
      await subtle.sign(
        {
          name: "RSA-PSS",
          saltLength: 32,
        },
        privateKeyCrypto,
        thingToSign
      )
    ).toString("base64");

    const result = await fetch(`http://localhost:${PORT}/api/user/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ publicKey: "mypublickey" }),
      headers: {
        "x-user-id": userId,
        authorization: `Bearer ${signature}`,
      },
    }).then((r) => r.json());
    expect(result.userId).toEqual("1");
  });
});
