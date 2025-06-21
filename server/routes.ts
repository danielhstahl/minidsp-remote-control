"use strict";
import Fastify from "fastify";
import type { FastifyRequest } from "fastify";
import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import { turnOn, turnOff, getStatus, openPin } from "./gpio.ts";
import { X509Certificate } from "crypto";
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
  const fastify = Fastify({
    logger: true,
  });
  fastify.addHook("onClose", async (instance) => {
    db.close();
    const { schedule } = getSchedule();
    await schedule.destroy();
  });
  fastify.register(async function (fastify) {
    const gpio = USE_GPIO ? openPin(parseInt(RELAY_PIN)) : undefined;
    const userObj = getAllUsers(db);
    setDefaultSettings(db);
    const getSettingsHof = () => getSettings(db) || { requireAuth: false };
    const getStrategiesHof = (
      req: FastifyRequest<{ Headers: Headers }>,
      stringToSign: string,
    ) => {
      const { [AUTHORIZATION_KEY]: authHeader, [X_USER_KEY]: userId } =
        getHeadersFromObject(req.headers);
      const publicKey = userObj[userId];
      const noStrategy = () => noAuthStrategy(getSettingsHof);
      const pKStrategy = () =>
        privateKeyStrategy(authHeader, publicKey, stringToSign);
      const basicStrategy = () => basicAuthStrategy(authHeader, COMPARE_STRING);
      return { noStrategy, pKStrategy, basicStrategy };
    };
    fastify.get("/api/root_pem", (req, reply) => {
      const stream = fs.createReadStream(ROOT_PEM_PATH);
      reply.header("Content-Disposition", "attachment; filename=rootCA.pem");
      reply.send(stream).type("application/octet-stream").code(200);
    });
    fastify.get("/api/auth_settings", (req, reply) => {
      fs.readFile(ROOT_PEM_PATH, function (err, contents) {
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
      async (
        req: FastifyRequest<{ Body: AuthBody; Headers: Headers }>,
        reply,
      ) => {
        const stringToSign = getStringToSign();
        const { noStrategy, pKStrategy, basicStrategy } = getStrategiesHof(
          req,
          stringToSign,
        );
        const { isAuthenticated, description } = await checkStrategies(
          noStrategy,
          pKStrategy,
          basicStrategy,
        );
        logAuthDescription(req, description);
        if (!isAuthenticated) {
          return reply.code(403).send(description);
        }
        const { requireAuth } = req.body;
        setSettings(db, requireAuth);
        return reply.send({ requireAuth, stringToSign });
      },
    );
    fastify.post(
      "/api/user",
      async (
        req: FastifyRequest<{ Body: UserBody; Headers: Headers }>,
        reply,
      ) => {
        const { noStrategy, pKStrategy } = getStrategiesHof(
          req,
          getStringToSign(),
        );
        const { isAuthenticated, description } = await checkStrategies(
          noStrategy,
          pKStrategy,
        );
        logAuthDescription(req, description);
        if (!isAuthenticated) {
          return reply.code(403).send(description);
        }
        const { publicKey } = req.body;
        const { key: userId } = createUser(db, publicKey);
        //cache so don't have to reload database
        userObj[userId] = publicKey;
        return reply.send({ userId: userId.toString() });
      },
    );
    fastify.patch(
      "/api/user/:userId",
      async (
        req: FastifyRequest<{
          Body: UserBody;
          Params: UserParams;
          Headers: Headers;
        }>,
        reply,
      ) => {
        const { noStrategy, pKStrategy } = getStrategiesHof(
          req,
          getStringToSign(),
        );
        const { isAuthenticated, description } = await checkStrategies(
          noStrategy,
          pKStrategy,
        );
        logAuthDescription(req, description);
        if (!isAuthenticated) {
          return reply.code(403).send(description);
        }
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
      async (req: FastifyRequest<{ Headers: Headers }>, reply) => {
        const { noStrategy, pKStrategy } = getStrategiesHof(
          req,
          getStringToSign(),
        );
        const { isAuthenticated, description } = await checkStrategies(
          noStrategy,
          pKStrategy,
        );
        logAuthDescription(req, description);
        if (!isAuthenticated) {
          return reply.code(403).send(description);
        }
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
      async (req: FastifyRequest<{ Headers: Headers }>, reply) => {
        const { noStrategy, pKStrategy } = getStrategiesHof(
          req,
          getStringToSign(),
        );
        const { isAuthenticated, description } = await checkStrategies(
          noStrategy,
          pKStrategy,
        );
        logAuthDescription(req, description);
        if (!isAuthenticated) {
          return reply.code(403).send(description);
        }
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
      async (req: FastifyRequest<{ Headers: Headers }>, reply) => {
        const { noStrategy, pKStrategy } = getStrategiesHof(
          req,
          getStringToSign(),
        );
        const { isAuthenticated, description } = await checkStrategies(
          noStrategy,
          pKStrategy,
        );
        logAuthDescription(req, description);
        if (!isAuthenticated) {
          return reply.code(403).send(description);
        }
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
      async (req: FastifyRequest<{ Headers: Headers }>, reply) => {
        const { noStrategy, pKStrategy } = getStrategiesHof(
          req,
          getStringToSign(),
        );
        const { isAuthenticated, description } = await checkStrategies(
          noStrategy,
          pKStrategy,
        );
        logAuthDescription(req, description);
        if (!isAuthenticated) {
          return reply.code(403).send(description);
        }
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
      async (
        req: FastifyRequest<{ Params: VolumeParams; Headers: Headers }>,
        reply,
      ) => {
        const { noStrategy, pKStrategy } = getStrategiesHof(
          req,
          getStringToSign(),
        );
        const { isAuthenticated, description } = await checkStrategies(
          noStrategy,
          pKStrategy,
        );
        logAuthDescription(req, description);
        if (!isAuthenticated) {
          return reply.code(403).send(description);
        }
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
      async (
        req: FastifyRequest<{ Params: PresetParams; Headers: Headers }>,
        reply,
      ) => {
        const { noStrategy, pKStrategy } = getStrategiesHof(
          req,
          getStringToSign(),
        );
        const { isAuthenticated, description } = await checkStrategies(
          noStrategy,
          pKStrategy,
        );
        logAuthDescription(req, description);
        if (!isAuthenticated) {
          return reply.code(403).send(description);
        }
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
      async (
        req: FastifyRequest<{ Params: SourceParams; Headers: Headers }>,
        reply,
      ) => {
        const { noStrategy, pKStrategy } = getStrategiesHof(
          req,
          getStringToSign(),
        );
        const { isAuthenticated, description } = await checkStrategies(
          noStrategy,
          pKStrategy,
        );
        logAuthDescription(req, description);
        if (!isAuthenticated) {
          return reply.code(403).send(description);
        }
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
      async (req: FastifyRequest<{ Headers: Headers }>, reply) => {
        const { noStrategy, pKStrategy } = getStrategiesHof(
          req,
          getStringToSign(),
        );
        const { isAuthenticated, description } = await checkStrategies(
          noStrategy,
          pKStrategy,
        );
        logAuthDescription(req, description);
        if (!isAuthenticated) {
          return reply.code(403).send(description);
        }
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
      async (req: FastifyRequest<{ Headers: Headers }>, reply) => {
        const { noStrategy, pKStrategy } = getStrategiesHof(
          req,
          getStringToSign(),
        );
        const { isAuthenticated, description } = await checkStrategies(
          noStrategy,
          pKStrategy,
        );
        logAuthDescription(req, description);
        if (!isAuthenticated) {
          return reply.code(403).send(description);
        }
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
