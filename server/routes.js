"use strict";
const Fastify = require("fastify");

//cat /sys/kernel/debug/gpio
const {
  env: { RELAY_PIN, USE_RELAY, DOMAIN },
} = require("process");
const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");
const { turnOn, turnOff, getStatus, openPin } = require("./gpio");
const { X509Certificate } = require("crypto");
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

function minidspStatus() {
  return new Promise((res, rej) =>
    execFile(`minidsp`, ["-o", "json"], (err, stdout, stderr) => {
      if (err) {
        rej(err);
      } else {
        res(JSON.parse(stdout).master);
      }
    })
  );
}

function setMinidspVol(gain) {
  return new Promise((res, rej) =>
    execFile(`minidsp`, ["gain", "--", gain], (err, stdout, stderr) => {
      if (err) {
        rej(err);
      } else {
        res();
      }
    })
  );
}

function incrementMinidspVol(gain) {
  return new Promise((res, rej) =>
    execFile(
      `minidsp`,
      ["gain", "--relative", "--", gain],
      (err, stdout, stderr) => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      }
    )
  );
}

function setMinidspPreset(preset) {
  //0 indexed
  return new Promise((res, rej) =>
    execFile(`minidsp`, ["config", preset], (err, stdout, stderr) => {
      if (err) {
        rej(err);
      } else {
        res();
      }
    })
  );
}

function setMinidspInput(source) {
  // note that the source output from minidspStatus has first letter capitalized,
  // but setting the source requires lowercase
  // see https://minidsp-rs.pages.dev/cli/master/source
  return new Promise((res, rej) =>
    execFile(
      `minidsp`,
      ["source", source.toLowerCase()],
      (err, stdout, stderr) => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      }
    )
  );
}

function generateCert() {
  return new Promise((res, rej) =>
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
      }
    )
  );
}
const VOLUME_INCREMENT = 0.5;
const USE_GPIO = USE_RELAY ? true : false;
const ROOT_PEM_PATH = "/home/minidsp/ssl/rootCA.pem";
const getSchedule = setCronRotation();
const getStringToSign = () => getSchedule().uuid;
const createFastify = (dbName) => {
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
    const getSettingsHof = () => getSettings(db);
    const authHof = (req, reply, stringToSign) => {
      return auth(req, reply, getSettingsHof, verifyKey, userObj, stringToSign);
    };
    fastify.get("/api/root_pem", (req, reply) => {
      const stream = fs.createReadStream(ROOT_PEM_PATH);
      reply.header("Content-Disposition", "attachment; filename=rootCA.pem");
      reply.send(stream).type("application/octet-stream").code(200);
    });
    fastify.get("/api/auth_settings", (req, reply) => {
      fs.readFile(ROOT_PEM_PATH, function (err, contents) {
        const x509 = new X509Certificate(contents);
        reply.send({
          subject: x509.subject,
          issuer: x509.issuer,
          validFrom: x509.validFrom,
          validTo: x509.validTo,
          validFromDate: x509.validFromDate,
          validToDate: x509.validToDate,
          ...getSettings(),
          stringToSign: getStringToSign(),
        });
      });
    });
    fastify.post("/api/auth_settings", (req, reply) => {
      const stringToSign = getStringToSign();
      authHof(req, reply, stringToSign);
      const { requireAuth } = JSON.parse(req.body);
      setSettings(db, requireAuth);
      reply.send({ requireAuth, stringToSign });
    });
    fastify.post("/api/user", (req, reply) => {
      authHof(req, reply, getStringToSign());
      const { publicKey } = JSON.parse(req.body);
      const { key: userId } = createUser(db, publicKey);
      //cache so don't have to reload database
      userObj[userId] = publicKey;
      reply.send({ userId: userId.toString() });
    });
    fastify.patch("/api/user/:userId", (req, reply) => {
      authHof(req, reply, getStringToSign());
      const { userId } = req.params;
      const { publicKey } = JSON.parse(req.body);
      updateUser(db, publicKey, userId);
      //cache so don't have to reload database
      userObj[userId] = publicKey;
      reply.send({ userId: userId.toString() });
    });
    fastify.post("/api/regenerate_cert", (req, reply) => {
      authHof(req, reply, getStringToSign());
      generateCert()
        .then(() => {
          reply.send({ success: true });
        })
        .catch((e) => {
          reply.send({ success: false, message: e });
        });
    });
    fastify.get("/api/status", (req, reply) => {
      authHof(req, reply, getStringToSign());
      Promise.all([
        minidspStatus(),
        USE_GPIO ? powerStatus(gpio) : Promise.resolve("on"),
      ])
        .then(([minidsp, power]) => {
          const { preset, mute, source, volume } = minidsp;
          reply.send({ preset, source, volume, power });
        })
        .catch((e) => {
          reply.send({ success: false, message: e });
        });
    });
    fastify.post("/api/volume/up", (req, reply) => {
      authHof(req, reply, getStringToSign());
      incrementMinidspVol(VOLUME_INCREMENT)
        .then(() => {
          reply.send({ success: true });
        })
        .catch((e) => {
          reply.send({ success: false, message: e });
        });
    });
    fastify.post("/api/volume/down", (req, reply) => {
      authHof(req, reply, getStringToSign());
      incrementMinidspVol(-VOLUME_INCREMENT)
        .then(() => {
          reply.send({ success: true });
        })
        .catch((e) => {
          reply.send({ success: false, message: e });
        });
    });
    fastify.post("/api/volume/:volume", (req, reply) => {
      authHof(req, reply, getStringToSign());
      const { volume } = req.params;
      setMinidspVol(volume)
        .then(() => {
          reply.send({ success: true });
        })
        .catch((e) => {
          reply.send({ success: false, message: e });
        });
    });
    fastify.post("/api/preset/:preset", (req, reply) => {
      authHof(req, reply, getStringToSign());
      const { preset } = req.params;
      setMinidspPreset(preset)
        .then(() => {
          reply.send({ success: true });
        })
        .catch((e) => {
          reply.send({ success: false, message: e });
        });
    });
    fastify.post("/api/source/:source", (req, reply) => {
      authHof(req, reply, getStringToSign());
      const { source } = req.params;
      setMinidspInput(source)
        .then(() => {
          reply.send({ success: true });
        })
        .catch((e) => {
          reply.send({ success: false, message: e });
        });
    });
    fastify.post("/api/power/on", (req, reply) => {
      authHof(req, reply, getStringToSign());
      if (!USE_GPIO) {
        return reply.send({ success: false, message: "Power not implemented" });
      }
      powerOn(gpio)
        .then(() => {
          reply.send({ success: true });
        })
        .catch((e) => {
          reply.send({ success: false, message: e });
        });
    });
    fastify.post("/api/power/off", (req, reply) => {
      authHof(req, reply, getStringToSign());
      if (!USE_GPIO) {
        return reply.send({ success: false, message: "Power not implemented" });
      }
      powerOff(gpio)
        .then(() => {
          reply.send({ success: true });
        })
        .catch((e) => {
          reply.send({ success: false, message: e });
        });
    });
  });
  return fastify;
};

module.exports = {
  createFastify,
};
