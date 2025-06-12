"use strict";
import Fastify from "fastify";
import type { FastifyRequest } from "fastify";

import fs from "fs";
import { auth, verifyKey, setCronRotation } from "./crypto.ts";
import {
  getAllUsers,
  setDefaultSettings,
  setSettings,
  getSettings,
  updateUser,
  createUser,
  setupDatabase,
} from "./db.ts";
interface UserParams {
  userId: string;
}
interface AuthBody {
  requireAuth: boolean;
}
interface UserBody {
  publicKey: string;
}
const database = setupDatabase(":memory:");
const userObj = getAllUsers(database);
console.log(userObj);
setDefaultSettings(database);

const fastify = Fastify({
  logger: true,
});
const getSchedule = setCronRotation();
const getStringToSign = () => getSchedule().uuid;
const getSettingsHof = () => getSettings(database) || { requireAuth: false };
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
  fastify.post(
    "/api/auth_settings",
    (req: FastifyRequest<{ Body: AuthBody }>, reply) => {
      const stringToSign = getStringToSign();
      authHof(req, reply, stringToSign);
      const { requireAuth } = req.body;
      setSettings(database, requireAuth);
      reply.send({ requireAuth, stringToSign });
    }
  );
  fastify.post(
    "/api/user",
    (req: FastifyRequest<{ Body: UserBody }>, reply) => {
      authHof(req, reply, getStringToSign());
      const { publicKey } = req.body;
      const { key: userId } = createUser(database, publicKey);
      //cache so don't have to reload database
      userObj[userId] = publicKey;
      reply.send({ userId });
    }
  );

  fastify.patch(
    "/api/user/:userId",
    (req: FastifyRequest<{ Body: UserBody; Params: UserParams }>, reply) => {
      authHof(req, reply, getStringToSign());
      const { userId } = req.params;
      const { publicKey } = req.body;
      updateUser(database, publicKey, userId);
      //cache so don't have to reload database
      userObj[userId] = publicKey;
      reply.send({ userId });
    }
  );

  fastify.get("/api/status", (req, reply) => {
    authHof(req, reply, getStringToSign());
    reply.send({
      preset: 1,
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
