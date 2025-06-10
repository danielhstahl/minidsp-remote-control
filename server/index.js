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
const { auth, verifyKey, STRING_TO_SIGN } = require("./crypto.js");
const { DatabaseSync } = require("node:sqlite");
const database = new DatabaseSync("minidsp");
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
    `INSERT INTO ${USER_TABLE} (public_key) VALUES (?)`
  );
  const { lastInsertRowid } = insert.run(publicKey);
  return { key: lastInsertRowid, publicKey };
};

const updateUser = (publicKey, userId) => {
  const insert = database.prepare(
    `UPDATE ${USER_TABLE} set public_key= ? where key = ?`
  );
  insert.run(publicKey, userId);
  return { key: userId, publicKey };
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
    `UPDATE ${APP_SETTINGS_TABLE} SET require_auth=?;`
  );
  insert.run(requireAuthInt);
};

const setDefaultSettings = () => {
  const result = getSettings();
  if (!result) {
    const insert = database.prepare(
      `INSERT INTO ${APP_SETTINGS_TABLE} (require_auth) VALUES (?)` //don't require auth by default
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
      {}
    );
};

const userObj = getAllUsers();
console.log(userObj);
setDefaultSettings();

const fastify = Fastify({
  logger: true,
});

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

fastify.register(async function (fastify) {
  const gpio = USE_GPIO ? openPin(parseInt(RELAY_PIN)) : undefined;
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
        stringToSign: STRING_TO_SIGN,
      });
    });
  });
  fastify.post("/api/auth_settings", (req, reply) => {
    auth(req, reply, getSettings, verifyKey, userObj);
    const { requireAuth } = JSON.parse(req.body);
    setSettings(requireAuth);
    reply.send({ requireAuth, stringToSign: STRING_TO_SIGN });
  });
  fastify.post("/api/user", (req, reply) => {
    auth(req, reply, getSettings, verifyKey, userObj);
    const { publicKey } = JSON.parse(req.body);
    const { key: userId } = createUser(publicKey);
    //cache so don't have to reload database
    userObj[userId] = publicKey;
    reply.send({ userId });
  });
  fastify.patch("/api/user", (req, reply) => {
    auth(req, reply, getSettings, verifyKey, userObj);
    const { publicKey, userId } = JSON.parse(req.body);
    updateUser(publicKey, userId);
    //cache so don't have to reload database
    userObj[userId] = publicKey;
    reply.send({ userId });
  });
  fastify.post("/api/regenerate_cert", (req, reply) => {
    auth(req, reply, getSettings, verifyKey, userObj);
    generateCert()
      .then(() => {
        reply.send({ success: true });
      })
      .catch((e) => {
        reply.send({ success: false, message: e });
      });
  });
  fastify.get("/api/status", (req, reply) => {
    auth(req, reply, getSettings, verifyKey, userObj);
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
    auth(req, reply, getSettings, verifyKey, userObj);
    incrementMinidspVol(VOLUME_INCREMENT)
      .then(() => {
        reply.send({ success: true });
      })
      .catch((e) => {
        reply.send({ success: false, message: e });
      });
  });
  fastify.post("/api/volume/down", (req, reply) => {
    auth(req, reply, getSettings, verifyKey, userObj);
    incrementMinidspVol(-VOLUME_INCREMENT)
      .then(() => {
        reply.send({ success: true });
      })
      .catch((e) => {
        reply.send({ success: false, message: e });
      });
  });
  fastify.post("/api/volume/:volume", (req, reply) => {
    auth(req, reply, getSettings, verifyKey, userObj);
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
    auth(req, reply, getSettings, verifyKey, userObj);
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
    auth(req, reply, getSettings, verifyKey, userObj);
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
    auth(req, reply, getSettings, verifyKey, userObj);
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
    auth(req, reply, getSettings, verifyKey, userObj);
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

// Run the server!
try {
  fastify.listen({ port: 4000, host: "0.0.0.0" });
} catch (err) {
  fastify.log.error(err);
}
