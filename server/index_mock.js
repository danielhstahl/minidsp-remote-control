const Fastify = require('fastify')
const fastify = Fastify({
    logger: true
})
fastify.register(async function (fastify) {
    fastify.get('/status', (req, reply) => {
        reply.send({ preset: 1, source: "Unavailable", volume: -40, power: true, source: "hdmi" })
    })
    fastify.post("/volume/:volume", (req, reply) => {
        reply.send({ success: true })
    })
    fastify.post("/preset/:preset", (req, reply) => {
        reply.send({ success: true })
    })
    fastify.post("/source/:source", (req, reply) => {
        reply.send({ success: true })
    })
    fastify.post("/power/on", (req, reply) => {
        reply.send({ success: true })
    })
    fastify.post("/power/off", (req, reply) => {
        reply.send({ success: true })
    })
})
// Run the server!
try {
    fastify.listen({ port: 4000, host: '0.0.0.0' })
} catch (err) {
    fastify.log.error(err)
}