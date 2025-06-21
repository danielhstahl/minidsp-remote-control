"use strict";
import Fastify from "fastify";
import FastifyAuth from "@fastify/auth"
import type { FastifyReply, FastifyRequest } from "fastify";
import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import { turnOn, turnOff, getStatus, openPin } from "./gpio.ts";
import { X509Certificate } from "crypto";
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
import {
  minidspStatus,
  incrementMinidspVol,
  setMinidspInput,
  setMinidspVol,
  setMinidspPreset,
} from "./minidsp.ts";

interface Headers {
  "x-user-id": string;
  authorization: string;
}
declare module 'fastify' {
  export interface FastifyInstance {
    verifyApiKey(req: FastifyRequest, reply: FastifyReply): Promise<void>;
    verifyNoAuth(req: FastifyRequest, reply: FastifyReply): Promise<void>;
    verifyPrivateKey(req: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
}

//cat /sys/kernel/debug/gpio
const {
  env: { RELAY_PIN, USE_RELAY, DOMAIN, COMPARE_STRING },
} = process;
function powerOff(gpio) {
  return turnOff(gpio);
}

function powerOn(gpio) {
  return turnOn(gpio);
}

async function powerStatus(gpio) {
  const result = await getStatus(gpio);
  return result === 0 ? "off" : "on";
}

function generateCert() {
  return new Promise<void>((res, rej) =>
    execFile(
      path.resolve(__dirname, "scripts", "create_root_cert_and_key.sh"),
      [DOMAIN],
      (err, stdout, stderr) => {
        if (err) {
          console.log(stdout);
          console.log(stderr);
          rej(err);
        } else {
          res();
        }
      },
    ),
  );
}
const VOLUME_INCREMENT = 0.5;
const USE_GPIO = USE_RELAY ? true : false;
const ROOT_PEM_PATH = "/home/minidsp/ssl/rootCA.pem";
const getSchedule = setCronRotation();
const getStringToSign = () => getSchedule().uuid;

interface UserParams {
  userId: string;
}
interface SourceParams {
  source: string;
}
interface PresetParams {
  preset: number;
}
interface VolumeParams {
  volume: number;
}

interface AuthBody {
  requireAuth: boolean;
}
interface UserBody {
  publicKey: string;
}
const AUTHORIZATION_KEY = "authorization";
const X_USER_KEY = "x-user-id";
const getHeadersFromObject = (headers: Headers) => ({
  ...headers,
  [AUTHORIZATION_KEY]: headers[AUTHORIZATION_KEY] || "",
  [X_USER_KEY]: headers[X_USER_KEY] || "",
});

const logAuthDescription = (req: FastifyRequest, description: string) => {
  req.log.info(`Authentication result: ${description}`);
};

export const createFastify = (dbName: string) => {
  const db = setupDatabase(dbName);
  const getSettingsHof = () => getSettings(db) || { requireAuth: false };
  const userObj = getAllUsers(db);
  setDefaultSettings(db);
  const fastify = Fastify({
    logger: true,
  });
  fastify.addHook("onClose", async (_instance) => {
    console.log("closing")
    db.close();
    const { schedule } = getSchedule();
    await schedule.destroy();
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
    const gpio = USE_GPIO ? openPin(parseInt(RELAY_PIN)) : undefined;

    fastify.get("/api/root_pem", (_req, reply) => {
      const stream = fs.createReadStream(ROOT_PEM_PATH);
      reply.header("Content-Disposition", "attachment; filename=rootCA.pem");
      reply.send(stream).type("application/octet-stream").code(200);
    });
    fastify.get("/api/auth_settings", (_req, reply) => {
      fs.readFile(ROOT_PEM_PATH, function (_err, contents) {
        const x509 = new X509Certificate(contents);
        return reply.send({
          subject: x509.subject,
          issuer: x509.issuer,
          validFrom: x509.validFrom,
          validTo: x509.validTo,
          validFromDate: x509.validFromDate,
          validToDate: x509.validToDate,
          ...getSettings(db),
          stringToSign: getStringToSign(),
        });
      });
    });
    fastify.post(
      "/api/auth_settings",
      {
        preHandler: fastify.auth([
          fastify.verifyNoAuth,
          fastify.verifyPrivateKey,
          fastify.verifyApiKey //get out of jail (if end up locked out).  only this route has this verification
        ], { relation: 'or' }),
      },
      async (
        req: FastifyRequest<{ Body: AuthBody; Headers: Headers }>,
        reply,
      ) => {
        const stringToSign = getStringToSign();
        const { requireAuth } = req.body;
        setSettings(db, requireAuth);
        return reply.send({ requireAuth, stringToSign });
      },
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
        reply,
      ) => {
        const { publicKey } = req.body;
        const { key: userId } = createUser(db, publicKey);
        //cache so don't have to reload database
        userObj[userId] = publicKey;
        return reply.send({ userId: userId.toString() });
      },
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
        reply,
      ) => {
        const { userId } = req.params;
        const { publicKey } = req.body;
        updateUser(db, publicKey, userId);
        //cache so don't have to reload database
        userObj[userId] = publicKey;
        return reply.send({ userId });
      },
    );
    fastify.post(
      "/api/regenerate_cert",
      {
        preHandler: fastify.auth([
          fastify.verifyNoAuth,
          fastify.verifyPrivateKey
        ], { relation: 'or' }),
      },
      async (_req, reply) => {
        return generateCert()
          .then(() => {
            reply.send({ success: true });
          })
          .catch((e) => {
            reply.send({ success: false, message: e });
          });
      },
    );
    fastify.get(
      "/api/status",
      {
        preHandler: fastify.auth([
          fastify.verifyNoAuth,
          fastify.verifyPrivateKey
        ], { relation: 'or' }),
      },
      async (_req, reply) => {
        try {
          const [minidsp, power] = await Promise.all([
            minidspStatus(),
            USE_GPIO ? powerStatus(gpio) : Promise.resolve("on"),
          ]);
          const { preset, source, volume } = minidsp;
          return reply.send({ preset, source, volume, power });
        } catch (e) {
          return reply.send({ success: false, message: e });
        }
      },
    );
    fastify.post(
      "/api/volume/up",
      {
        preHandler: fastify.auth([
          fastify.verifyNoAuth,
          fastify.verifyPrivateKey
        ], { relation: 'or' }),
      },
      async (_req, reply) => {
        return incrementMinidspVol(VOLUME_INCREMENT)
          .then(() => {
            reply.send({ success: true });
          })
          .catch((e) => {
            reply.send({ success: false, message: e });
          });
      },
    );
    fastify.post(
      "/api/volume/down",
      {
        preHandler: fastify.auth([
          fastify.verifyNoAuth,
          fastify.verifyPrivateKey
        ], { relation: 'or' }),
      },
      async (_req, reply) => {
        return incrementMinidspVol(-VOLUME_INCREMENT)
          .then(() => {
            reply.send({ success: true });
          })
          .catch((e) => {
            reply.send({ success: false, message: e });
          });
      },
    );
    fastify.post(
      "/api/volume/:volume",
      {
        preHandler: fastify.auth([
          fastify.verifyNoAuth,
          fastify.verifyPrivateKey
        ], { relation: 'or' }),
      },
      async (
        req: FastifyRequest<{ Params: VolumeParams; Headers: Headers }>,
        reply,
      ) => {
        const { volume } = req.params;
        return setMinidspVol(volume)
          .then(() => {
            reply.send({ success: true });
          })
          .catch((e) => {
            reply.send({ success: false, message: e });
          });
      },
    );
    fastify.post(
      "/api/preset/:preset",
      {
        preHandler: fastify.auth([
          fastify.verifyNoAuth,
          fastify.verifyPrivateKey
        ], { relation: 'or' }),
      },
      async (
        req: FastifyRequest<{ Params: PresetParams; Headers: Headers }>,
        reply,
      ) => {
        const { preset } = req.params;
        return setMinidspPreset(preset)
          .then(() => {
            reply.send({ success: true });
          })
          .catch((e) => {
            reply.send({ success: false, message: e });
          });
      },
    );
    fastify.post(
      "/api/source/:source",
      {
        preHandler: fastify.auth([
          fastify.verifyNoAuth,
          fastify.verifyPrivateKey
        ], { relation: 'or' }),
      },
      async (
        req: FastifyRequest<{ Params: SourceParams; Headers: Headers }>,
        reply,
      ) => {
        const { source } = req.params;
        return setMinidspInput(source)
          .then(() => {
            reply.send({ success: true });
          })
          .catch((e) => {
            reply.send({ success: false, message: e });
          });
      },
    );
    fastify.post(
      "/api/power/on",
      {
        preHandler: fastify.auth([
          fastify.verifyNoAuth,
          fastify.verifyPrivateKey
        ], { relation: 'or' }),
      },
      async (_req, reply) => {
        if (!USE_GPIO) {
          return reply.send({
            success: false,
            message: "Power not implemented",
          });
        }
        return powerOn(gpio)
          .then(() => {
            reply.send({ success: true });
          })
          .catch((e) => {
            reply.send({ success: false, message: e });
          });
      },
    );
    fastify.post(
      "/api/power/off",
      {
        preHandler: fastify.auth([
          fastify.verifyNoAuth,
          fastify.verifyPrivateKey
        ], { relation: 'or' }),
      },
      async (_req, reply) => {
        if (!USE_GPIO) {
          return reply.send({
            success: false,
            message: "Power not implemented",
          });
        }
        return powerOff(gpio)
          .then(() => {
            reply.send({ success: true });
          })
          .catch((e) => {
            reply.send({ success: false, message: e });
          });
      },
    );
  });
  return fastify;
};
