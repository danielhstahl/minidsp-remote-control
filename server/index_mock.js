"use strict";
const Fastify = require("fastify");
const fs = require("fs");
const { verifyKey, STRING_TO_SIGN } = require("./crypto.js");
const { DatabaseSync } = require("node:sqlite");
const database = new DatabaseSync("tmp");
const USER_TABLE = "users";
const APP_SETTINGS_TABLE = "settings";

database.exec(`
  CREATE TABLE IF NOT EXISTS ${USER_TABLE}(
    key INTEGER PRIMARY KEY AUTOINCREMENT,
    public_key TEXT
  ) STRICT
`);
database.exec(`
  CREATE TABLE IF NOT EXISTS ${APP_SETTINGS_TABLE}(
    key INTEGER PRIMARY KEY AUTOINCREMENT,
    require_auth INTEGER
  ) STRICT
`);
const createUser = (publicKey) => {
  const insert = database.prepare(
    `INSERT INTO ${USER_TABLE} (public_key) VALUES (?)`,
  );
  const { lastInsertRowid } = insert.run(publicKey);
  return { key: lastInsertRowid, publicKey };
};

const getSettings = () => {
  const result = database
    .prepare(`SELECT key, require_auth from ${APP_SETTINGS_TABLE}`)
    .get();
  if (result) {
    const { key, require_auth: requireAuth } = result;
    return { key, requireAuth: requireAuth === 1 };
  }
  return undefined;
};
const setSettings = (requireAuth) => {
  const requireAuthInt = requireAuth ? 1 : 0;
  const insert = database.prepare(
    `UPDATE ${APP_SETTINGS_TABLE} SET require_auth=?;`,
  );
  insert.run(requireAuthInt);
};

const setDefaultSettings = () => {
  const result = getSettings();
  if (!result) {
    const insert = database.prepare(
      `INSERT INTO ${APP_SETTINGS_TABLE} (require_auth) VALUES (?)`, //don't require auth by default
    );
    insert.run(0);
  }
};

const getAllUsers = () => {
  return database
    .prepare(`SELECT key, public_key from ${USER_TABLE}`)
    .iterate()
    .reduce(
      (aggr, curr) => ({
        ...aggr,
        [curr.key]: curr.public_key,
      }),
      {},
    );
};

const userObj = getAllUsers();
setDefaultSettings();

const fastify = Fastify({
  logger: true,
});

const auth = (request, reply) => {
  const { requireAuth } = getSettings();
  if (!requireAuth) {
    return;
  }
  const authHeader = request.headers["authorization"]; //base64 string signed value
  const userId = request.headers["x-user-id"];
  if (authHeader.startsWith("Bearer ")) {
    signature = authHeader.substring(7, authHeader.length);
    const result = verifyKey(signature, userObj[userId]);
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

fastify.register(async function (fastify) {
  fastify.get("/api/root_pem", (req, reply) => {
    auth(req, reply);
    const stream = fs.createReadStream("mockcert.crt");
    reply.header("Content-Disposition", "attachment; filename=rootCA.pem");
    reply.send(stream).type("application/octet-stream").code(200);
  });
  fastify.get("/api/cert_info", (req, reply) => {
    auth(req, reply);
    const currDate = new Date("2025-05-05");
    const expiryDate = new Date("2025-06-03");
    reply.send({
      subject: "hello",
      issuer: "world",
      validFrom: "strdate",
      validTo: "strenddate",
      validFromDate: currDate,
      validToDate: expiryDate,
    });
  });
  fastify.get("/api/auth_settings", (req, reply) => {
    reply.send({
      ...getSettings(),
      stringToSign: STRING_TO_SIGN,
    });
  });
  fastify.post("/api/auth_settings", (req, reply) => {
    auth(req, reply);
    const { requireAuth } = JSON.parse(req.body);
    console.log(requireAuth);
    setSettings(requireAuth);
    reply.send({ requireAuth, stringToSign: STRING_TO_SIGN });
  });
  fastify.post("/api/user", (req, reply) => {
    auth(req, reply);
    const { publicKey } = JSON.parse(req.body);
    const { key: userId } = createUser(publicKey);
    //cache so don't have to reload database
    userObj[key] = publicKey;
    reply.send({ userId });
  });

  fastify.get("/api/status", (req, reply) => {
    auth(req, reply);
    reply.send({
      preset: 1,
      source: "Unavailable",
      volume: -40,
      power: true,
      source: "Hdmi",
    });
  });
  fastify.post("/api/volume/up", (req, reply) => {
    auth(req, reply);
    reply.send({ success: true });
  });
  fastify.post("/api/volume/down", (req, reply) => {
    auth(req, reply);
    reply.send({ success: true });
  });
  fastify.post("/api/volume/:volume", (req, reply) => {
    auth(req, reply);
    reply.send({ success: true });
  });
  fastify.post("/api/preset/:preset", (req, reply) => {
    auth(req, reply);
    reply.send({ success: true });
  });
  fastify.post("/api/source/:source", (req, reply) => {
    auth(req, reply);
    reply.send({ success: true });
  });
  fastify.post("/api/power/on", (req, reply) => {
    auth(req, reply);
    reply.send({ success: true });
  });
  fastify.post("/api/power/off", (req, reply) => {
    auth(req, reply);
    reply.send({ success: true });
  });
});
// Run the server!
try {
  fastify.listen({ port: 4000, host: "0.0.0.0" });
} catch (err) {
  fastify.log.error(err);
}
