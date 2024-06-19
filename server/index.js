'use strict'
const Fastify = require('fastify')
const http = require('http');
const httpProxy = require('@fastify/http-proxy')

const { env: { PORT, IP } } = require("process")

const fastify = Fastify({
    logger: true
})

console.log(IP)
const upstream = `http://${IP || "localhost"}:${PORT || 5380}`
fastify.register(httpProxy, {
    upstream,
    prefix: '/api', // optional
});
fastify.register(require('@fastify/websocket'))

const options = {
    hostname: IP || "localhost",
    port: PORT || 5380,
    path: '/devices/0',
    method: 'POST',
};

function httpPost({ body, ...options }) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            method: 'POST',
            ...options,
        }, res => {
            const chunks = [];
            res.on('data', data => chunks.push(data))
            res.on('end', () => {
                let resBody = Buffer.concat(chunks);
                switch (res.headers['content-type']) {
                    case 'application/json':
                        resBody = JSON.parse(resBody);
                        break;
                }
                resolve(resBody)
            })
        })
        req.on('error', reject);
        if (body) {
            req.write(body);
        }
        req.end();
    })
}


fastify.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, (socket, req) => {
        setInterval(() => {
            httpPost({ body: JSON.stringify({ master_status: { preset: 0 } }), ...options }).then(({ preset, mute, source, volume }) => {
                socket.send(JSON.stringify({ preset, source, volume }))
            })
        }, 2000)
    })
})

// Run the server!
try {
    fastify.listen({ port: 4000 })
} catch (err) {
    fastify.log.error(err)
    process.exit(1)
}