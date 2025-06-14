const Fastify = require("fastify");
const fs = require("fs");
const fastify = Fastify({
  logger: true,
});
fastify.register(async function (fastify) {
  fastify.get("/api/root_pem", (req, reply) => {
    const stream = fs.createReadStream("mockcert.crt");
    reply.header("Content-Disposition", "attachment; filename=rootCA.pem");
    reply.send(stream).type("application/octet-stream").code(200);
  });
  fastify.get("/api/cert_info", (req, reply) => {
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
  fastify.get("/api/status", (req, reply) => {
    reply.send({
      preset: 1,
      source: "Unavailable",
      volume: -40,
      power: true,
      source: "Hdmi",
    });
  });
  fastify.post("/api/volume/up", (req, reply) => {
    reply.send({ success: true });
  });
  fastify.post("/api/volume/down", (req, reply) => {
    reply.send({ success: true });
  });
  fastify.post("/api/volume/:volume", (req, reply) => {
    reply.send({ success: true });
  });
  fastify.post("/api/preset/:preset", (req, reply) => {
    reply.send({ success: true });
  });
  fastify.post("/api/source/:source", (req, reply) => {
    reply.send({ success: true });
  });
  fastify.post("/api/power/on", (req, reply) => {
    reply.send({ success: true });
  });
  fastify.post("/api/power/off", (req, reply) => {
    reply.send({ success: true });
  });
});
// Run the server!
try {
  fastify.listen({ port: 4000, host: "0.0.0.0" });
} catch (err) {
  fastify.log.error(err);
}
