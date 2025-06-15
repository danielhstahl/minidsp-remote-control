"use strict";
import Fastify from "fastify";
import type { FastifyRequest } from "fastify";

import fs from "fs";
interface Headers {
  "x-user-id": string;
  authorization: string;
}
import {
  setCronRotation,
  checkStrategies,
  noAuthStrategy,
  privateKeyStrategy,
  basicAuthStrategy,
} from "./crypto.ts";
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
const authHof = (
  req: FastifyRequest<{ Headers: Headers }>,
  stringToSign: string
) => {
  const authHeader = req.headers["authorization"];
  const userId = req.headers["x-user-id"];
  const publicKey = userObj[userId];
  const strategy1 = () => noAuthStrategy(getSettingsHof);
  const strategy2 = () =>
    privateKeyStrategy(authHeader, publicKey, stringToSign);
  return checkStrategies(strategy1, strategy2);
};
const COMPARE_STRING = "MOCK_COMPARE_STRING";
const authHofAuthSettings = (
  req: FastifyRequest<{ Headers: Headers }>,
  stringToSign: string
) => {
  const authHeader = req.headers["authorization"];
  const userId = req.headers["x-user-id"];
  const publicKey = userObj[userId];
  const strategy1 = () => noAuthStrategy(getSettingsHof);
  const strategy2 = () =>
    privateKeyStrategy(authHeader, publicKey, stringToSign);
  const strategy3 = () => basicAuthStrategy(authHeader, COMPARE_STRING);
  return checkStrategies(strategy1, strategy2, strategy3);
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
    async (
      req: FastifyRequest<{ Body: AuthBody; Headers: Headers }>,
      reply
    ) => {
      const stringToSign = getStringToSign();
      const { isAuthenticated, description } = await authHofAuthSettings(
        req,
        stringToSign
      );
      if (!isAuthenticated) {
        reply.code(403);
        return reply.send(description);
      }
      const { requireAuth } = req.body;
      setSettings(database, requireAuth);
      reply.send({ requireAuth, stringToSign });
    }
  );
  fastify.post(
    "/api/user",
    async (
      req: FastifyRequest<{ Body: UserBody; Headers: Headers }>,
      reply
    ) => {
      const { isAuthenticated, description } = await authHof(
        req,
        getStringToSign()
      );
      if (!isAuthenticated) {
        reply.code(403);
        return reply.send(description);
      }
      const { publicKey } = req.body;
      const { key: userId } = createUser(database, publicKey);
      //cache so don't have to reload database
      userObj[userId] = publicKey;
      reply.send({ userId });
    }
  );

  fastify.patch(
    "/api/user/:userId",
    async (
      req: FastifyRequest<{
        Body: UserBody;
        Params: UserParams;
        Headers: Headers;
      }>,
      reply
    ) => {
      const { isAuthenticated, description } = await authHof(
        req,
        getStringToSign()
      );
      if (!isAuthenticated) {
        reply.code(403);
        return reply.send(description);
      }
      const { userId } = req.params;
      const { publicKey } = req.body;
      updateUser(database, publicKey, userId);
      //cache so don't have to reload database
      userObj[userId] = publicKey;
      reply.send({ userId });
    }
  );

  fastify.get(
    "/api/status",
    async (req: FastifyRequest<{ Headers: Headers }>, reply) => {
      const { isAuthenticated, description } = await authHof(
        req,
        getStringToSign()
      );
      if (!isAuthenticated) {
        reply.code(403);
        return reply.send(description);
      }
      reply.send({
        preset: 1,
        volume: -40,
        power: true,
        source: "Hdmi",
      });
    }
  );
  fastify.post(
    "/api/volume/up",
    async (req: FastifyRequest<{ Headers: Headers }>, reply) => {
      const { isAuthenticated, description } = await authHof(
        req,
        getStringToSign()
      );
      if (!isAuthenticated) {
        reply.code(403);
        return reply.send(description);
      }
      reply.send({ success: true });
    }
  );
  fastify.post(
    "/api/volume/down",
    async (req: FastifyRequest<{ Headers: Headers }>, reply) => {
      const { isAuthenticated, description } = await authHof(
        req,
        getStringToSign()
      );
      if (!isAuthenticated) {
        reply.code(403);
        return reply.send(description);
      }
      reply.send({ success: true });
    }
  );
  fastify.post(
    "/api/volume/:volume",
    async (req: FastifyRequest<{ Headers: Headers }>, reply) => {
      const { isAuthenticated, description } = await authHof(
        req,
        getStringToSign()
      );
      if (!isAuthenticated) {
        reply.code(403);
        return reply.send(description);
      }
      reply.send({ success: true });
    }
  );
  fastify.post(
    "/api/preset/:preset",
    async (req: FastifyRequest<{ Headers: Headers }>, reply) => {
      const { isAuthenticated, description } = await authHof(
        req,
        getStringToSign()
      );
      if (!isAuthenticated) {
        reply.code(403);
        return reply.send(description);
      }
      reply.send({ success: true });
    }
  );
  fastify.post(
    "/api/source/:source",
    async (req: FastifyRequest<{ Headers: Headers }>, reply) => {
      const { isAuthenticated, description } = await authHof(
        req,
        getStringToSign()
      );
      if (!isAuthenticated) {
        reply.code(403);
        return reply.send(description);
      }
      reply.send({ success: true });
    }
  );
  fastify.post(
    "/api/power/on",
    async (req: FastifyRequest<{ Headers: Headers }>, reply) => {
      const { isAuthenticated, description } = await authHof(
        req,
        getStringToSign()
      );
      if (!isAuthenticated) {
        reply.code(403);
        return reply.send(description);
      }
      reply.send({ success: true });
    }
  );
  fastify.post(
    "/api/power/off",
    async (req: FastifyRequest<{ Headers: Headers }>, reply) => {
      const { isAuthenticated, description } = await authHof(
        req,
        getStringToSign()
      );
      if (!isAuthenticated) {
        reply.code(403);
        return reply.send(description);
      }
      reply.send({ success: true });
    }
  );
});
// Run the server!
try {
  fastify.listen({ port: 4000, host: "0.0.0.0" });
} catch (err) {
  fastify.log.error(err);
}
