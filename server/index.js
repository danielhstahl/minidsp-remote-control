"use strict";
const { createFastify } = require("./routes");

// Run the server!
try {
  const fastify = createFastify("minidsp");
  fastify.listen({ port: 4000, host: "0.0.0.0" });
} catch (err) {
  fastify.log.error(err);
}
