"use strict";
import { createFastify } from "./routes.ts";
const {
  env: { DB_PATH },
} = process;
const fastify = createFastify(DB_PATH || "minidsp");
// Run the server!
try {
  fastify.listen({ port: 4000, host: "0.0.0.0" });
} catch (err) {
  fastify.log.error(err);
}
