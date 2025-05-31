"use strict";
const Fastify = require("fastify");

//cat /sys/kernel/debug/gpio
const {
  env: { RELAY_PIN, USE_RELAY },
} = require("process");
const { execFile } = require("child_process");
const fs = require("fs");
const { turnOn, turnOff, getStatus, openPin } = require("./gpio");
const { X509Certificate } = require("crypto");
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
    }),
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
    }),
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
      },
    ),
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
    }),
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
      },
    ),
  );
}
const VOLUME_INCREMENT = 0.5;
const USE_GPIO = USE_RELAY ? true : false;
fastify.register(async function (fastify) {
  const gpio = USE_GPIO ? openPin(parseInt(RELAY_PIN)) : undefined;
  fastify.get("/api/rootpem", (req, reply) => {
    const stream = fs.createReadStream("/etc/ssl/local/rootCA.pem");
    reply.header("Content-Disposition", "attachment; filename=rootCA.pem");
    reply.send(stream).type("application/octet-stream").code(200);
  });
  fastify.get("/api/certexpiry", (req, reply) => {
    fs.readFile("/etc/ssl/local/rootCA.pem", function (err, contents) {
      const x509 = X509Certificate(contents);
      reply.send({ certExpiry: x509.validToDate() });
    });
  });
  fastify.get("/api/status", (req, reply) => {
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
    incrementMinidspVol(VOLUME_INCREMENT)
      .then(() => {
        reply.send({ success: true });
      })
      .catch((e) => {
        reply.send({ success: false, message: e });
      });
  });
  fastify.post("/api/volume/down", (req, reply) => {
    incrementMinidspVol(-VOLUME_INCREMENT)
      .then(() => {
        reply.send({ success: true });
      })
      .catch((e) => {
        reply.send({ success: false, message: e });
      });
  });
  fastify.post("/api/volume/:volume", (req, reply) => {
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

/*
fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "build"),
  prefix: "/", // optional: default '/'
});
*/

// Run the server!
try {
  fastify.listen({ port: 4000, host: "0.0.0.0" });
} catch (err) {
  fastify.log.error(err);
}
