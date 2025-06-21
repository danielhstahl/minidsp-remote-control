"use strict";
import Fastify from "fastify";
import FastifyAuth from "@fastify/auth"
import type { FastifyRequest } from "fastify";

import fs from "fs";
interface Headers {
  "x-user-id": string;
  authorization: string;
}
import {
  setCronRotation,
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
const logAuthDescription = (req: FastifyRequest, description: string) => {
  req.log.info(`Authentication result: ${description}`);
};
const AUTHORIZATION_KEY = "authorization";
const X_USER_KEY = "x-user-id";
const COMPARE_STRING = "MOCK_COMPARE_STRING";
const getHeadersFromObject = (headers: Headers) => ({
  ...headers,
  [AUTHORIZATION_KEY]: headers[AUTHORIZATION_KEY] || "",
  [X_USER_KEY]: headers[X_USER_KEY] || "",
});

fastify.decorate('verifyNoAuth', async function (request, _reply) {
  const { description, isAuthenticated } = await noAuthStrategy(getSettingsHof)
  logAuthDescription(request, description)
  if (!isAuthenticated) {
    throw new Error(description) // pass an error if the authentication fails
  }
})
  .decorate('verifyPrivateKey', async function (request: FastifyRequest<{ Headers: Headers }>, _reply) {
    const { [AUTHORIZATION_KEY]: authHeader, [X_USER_KEY]: userId } =
      getHeadersFromObject(request.headers);
    const publicKey = userObj[userId];
    const stringToSign = getStringToSign();
    const { description, isAuthenticated } = await privateKeyStrategy(authHeader, publicKey, stringToSign)
    logAuthDescription(request, description)
    if (!isAuthenticated) {
      throw new Error(description) // pass an error if the authentication fails
    }
  })
  .decorate('verifyApiKey', async function (request: FastifyRequest<{ Headers: Headers }>, _reply) {
    const { [AUTHORIZATION_KEY]: authHeader } =
      getHeadersFromObject(request.headers);
    const { description, isAuthenticated } = await basicAuthStrategy(authHeader, COMPARE_STRING)
    logAuthDescription(request, description)
    if (!isAuthenticated) {
      throw new Error(description) // pass an error if the authentication fails
    }
  })
  .register(FastifyAuth)
fastify.after(async function () {
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
    {
      preHandler: fastify.auth([
        fastify.verifyNoAuth,
        fastify.verifyPrivateKey,
        fastify.verifyApiKey
      ], { relation: 'or' }),
    },
    async (
      req: FastifyRequest<{ Body: AuthBody; Headers: Headers }>,
      reply
    ) => {
      const stringToSign = getStringToSign();

      const { requireAuth } = req.body;
      setSettings(database, requireAuth);
      reply.send({ requireAuth, stringToSign });
    }
  );
  fastify.post(
    "/api/user",
    {
      preHandler: fastify.auth([
        fastify.verifyNoAuth,
        fastify.verifyPrivateKey
      ], { relation: 'or' }),
    },
    async (
      req: FastifyRequest<{ Body: UserBody; Headers: Headers }>,
      reply
    ) => {
      const { publicKey } = req.body;
      const { key: userId } = createUser(database, publicKey);
      //cache so don't have to reload database
      userObj[userId] = publicKey;
      reply.send({ userId });
    }
  );

  fastify.patch(
    "/api/user/:userId",
    {
      preHandler: fastify.auth([
        fastify.verifyNoAuth,
        fastify.verifyPrivateKey
      ], { relation: 'or' }),
    },
    async (
      req: FastifyRequest<{
        Body: UserBody;
        Params: UserParams;
        Headers: Headers;
      }>,
      reply
    ) => {
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
    {
      preHandler: fastify.auth([
        fastify.verifyNoAuth,
        fastify.verifyPrivateKey
      ], { relation: 'or' }),
    },
    async (req: FastifyRequest<{ Headers: Headers }>, reply) => {
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
    {
      preHandler: fastify.auth([
        fastify.verifyNoAuth,
        fastify.verifyPrivateKey
      ], { relation: 'or' }),
    },
    async (req: FastifyRequest<{ Headers: Headers }>, reply) => {
      reply.send({ success: true });
    }
  );
  fastify.post(
    "/api/volume/down",
    {
      preHandler: fastify.auth([
        fastify.verifyNoAuth,
        fastify.verifyPrivateKey
      ], { relation: 'or' }),
    },
    async (req: FastifyRequest<{ Headers: Headers }>, reply) => {
      reply.send({ success: true });
    }
  );
  fastify.post(
    "/api/volume/:volume",
    {
      preHandler: fastify.auth([
        fastify.verifyNoAuth,
        fastify.verifyPrivateKey
      ], { relation: 'or' }),
    },
    async (req: FastifyRequest<{ Headers: Headers }>, reply) => {
      reply.send({ success: true });
    }
  );
  fastify.post(
    "/api/preset/:preset",
    {
      preHandler: fastify.auth([
        fastify.verifyNoAuth,
        fastify.verifyPrivateKey
      ], { relation: 'or' }),
    },
    async (req: FastifyRequest<{ Headers: Headers }>, reply) => {
      reply.send({ success: true });
    }
  );
  fastify.post(
    "/api/source/:source",
    {
      preHandler: fastify.auth([
        fastify.verifyNoAuth,
        fastify.verifyPrivateKey
      ], { relation: 'or' }),
    },
    async (req: FastifyRequest<{ Headers: Headers }>, reply) => {
      reply.send({ success: true });
    }
  );
  fastify.post(
    "/api/power/on",
    {
      preHandler: fastify.auth([
        fastify.verifyNoAuth,
        fastify.verifyPrivateKey
      ], { relation: 'or' }),
    },
    async (req: FastifyRequest<{ Headers: Headers }>, reply) => {
      reply.send({ success: true });
    }
  );
  fastify.post(
    "/api/power/off",
    {
      preHandler: fastify.auth([
        fastify.verifyNoAuth,
        fastify.verifyPrivateKey
      ], { relation: 'or' }),
    },
    async (req: FastifyRequest<{ Headers: Headers }>, reply) => {
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
