"use strict";
const Fastify = require("fastify");
const fs = require("fs");
const { auth, verifyKey, setCronRotation } = require("./crypto.js");
const {
  getAllUsers,
  setDefaultSettings,
  setSettings,
  getSettings,
  updateUser,
  createUser,
  setupDatabase,
} = require("./db");

const database = setupDatabase("tmp");
const userObj = getAllUsers(database);
console.log(userObj);
setDefaultSettings();

const fastify = Fastify({
  logger: true,
});
const getSchedule = setCronRotation();
const getStringToSign = () => getSchedule().uuid;
const getSettingsHof = () => getSettings(db);
const authHof = (req, reply, stringToSign) => {
  return auth(req, reply, getSettingsHof, verifyKey, userObj, stringToSign);
};

fastify.register(async function (fastify) {
  fastify.get("/api/root_pem", (req, reply) => {
    const stream = fs.createReadStream("mockcert.crt");
    reply.header("Content-Disposition", "attachment; filename=rootCA.pem");
    reply.send(stream).type("application/octet-stream").code(200);
  });
  fastify.get("/api/auth_settings", (req, reply) => {
    const currDate = new Date("2025-05-05");
    const expiryDate = new Date("2025-06-03");
    reply.send({
      subject: "hello",
      issuer: "world",
      validFrom: "strdate",
      validTo: "strenddate",
      validFromDate: currDate,
      validToDate: expiryDate,
      ...getSettings(database),
      stringToSign: getStringToSign(),
    });
  });
  fastify.post("/api/auth_settings", (req, reply) => {
    const stringToSign = getStringToSign();
    authHof(req, reply, stringToSign);
    const { requireAuth } = JSON.parse(req.body);
    setSettings(database, requireAuth);
    reply.send({ requireAuth, stringToSign });
  });
  fastify.post("/api/user", (req, reply) => {
    authHof(req, reply, getStringToSign());
    const { publicKey } = JSON.parse(req.body);
    const { key: userId } = createUser(database, publicKey);
    //cache so don't have to reload database
    userObj[userId] = publicKey;
    reply.send({ userId });
  });

  fastify.patch("/api/user", (req, reply) => {
    authHof(req, reply, getStringToSign());
    const { publicKey, userId } = JSON.parse(req.body);
    updateUser(database, publicKey, userId);
    //cache so don't have to reload database
    userObj[userId] = publicKey;
    reply.send({ userId });
  });

  fastify.get("/api/status", (req, reply) => {
    authHof(req, reply, getStringToSign());
    reply.send({
      preset: 1,
      source: "Unavailable",
      volume: -40,
      power: true,
      source: "Hdmi",
    });
  });
  fastify.post("/api/volume/up", (req, reply) => {
    authHof(req, reply, getStringToSign());
    reply.send({ success: true });
  });
  fastify.post("/api/volume/down", (req, reply) => {
    authHof(req, reply, getStringToSign());
    reply.send({ success: true });
  });
  fastify.post("/api/volume/:volume", (req, reply) => {
    authHof(req, reply, getStringToSign());
    reply.send({ success: true });
  });
  fastify.post("/api/preset/:preset", (req, reply) => {
    authHof(req, reply, getStringToSign());
    reply.send({ success: true });
  });
  fastify.post("/api/source/:source", (req, reply) => {
    authHof(req, reply, getStringToSign());
    reply.send({ success: true });
  });
  fastify.post("/api/power/on", (req, reply) => {
    authHof(req, reply, getStringToSign());
    reply.send({ success: true });
  });
  fastify.post("/api/power/off", (req, reply) => {
    authHof(req, reply, getStringToSign());
    reply.send({ success: true });
  });
});
// Run the server!
try {
  fastify.listen({ port: 4000, host: "0.0.0.0" });
} catch (err) {
  fastify.log.error(err);
}
