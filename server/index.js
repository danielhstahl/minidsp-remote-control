'use strict'
const Fastify = require('fastify')
const { execFile } = require('child_process');
const { env: { USB_INDEX } } = require("process")

const fastify = Fastify({
    logger: true
})

const usbIndex = USB_INDEX || 2
fastify.register(require('@fastify/websocket'))

//for me usbIndex is "2", run `uhubctl` to get a list of usb ports
//uhubctl is assumed to be in your path, and index.js needs to run as root
//see https://www.byfarthersteps.com/6802/
function powerOff(usbIndex) {
    return new Promise((res, rej) => execFile(
        `uhubctl`,
        ['-l', '1-1', '-p', usbIndex, '-a', 'off'],
        (err, stdout, stderr) => {
            if (err) {
                rej(err)
            }
            else {
                res(stdout)
            }
        }))
}

//for me usbIndex is "2", run `uhubctl` to get a list of usb ports
//uhubctl is assumed to be in your path, and index.js needs to run as root
//see https://www.byfarthersteps.com/6802/
function powerOn(usbIndex) {
    return new Promise((res, rej) => execFile(
        `uhubctl`,
        ['-l', '1-1', '-p', usbIndex, '-a', 'on'],
        (err, stdout, stderr) => {
            if (err) {
                rej(err)
            }
            else {
                res(stdout)
            }
        }))

}

//for me usbIndex is "2", run `uhubctl` to get a list of usb ports
//uhubctl is assumed to be in your path, and index.js needs to run as root
//see https://www.byfarthersteps.com/6802/
function powerStatus(usbIndex) {
    return new Promise((res, rej) => execFile(
        `uhubctl`,
        ['-l', '1-1', '-p', usbIndex],
        (err, stdout, stderr) => {
            if (err) {
                rej(err)
            }
            else {
                res(stdout.search("off") === -1 ? "on" : "off")
            }
        }))
}

function minidspStatus() {
    return new Promise((res, rej) => execFile(`minidsp`, ['-o', 'json'], (err, stdout, stderr) => {
        if (err) {
            rej(err)
        }
        else {
            res(JSON.parse(stdout).master)
        }
    }))
}

function setMinidspVol(gain) {
    return new Promise((res, rej) => execFile(`minidsp`, ['gain', '--', gain], (err, stdout, stderr) => {
        if (err) {
            rej(err)
        }
        else {
            res()
        }
    }))
}

function setMinidspPreset(preset) { //0 indexed
    return new Promise((res, rej) => execFile(`minidsp`, ['config', preset], (err, stdout, stderr) => {
        if (err) {
            rej(err)
        }
        else {
            res()
        }
    }))
}

fastify.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, (socket, req) => {
        const interval = setInterval(() => {
            Promise.all([
                minidspStatus(),
                powerStatus(usbIndex)
            ]).then(([minidsp, power]) => {
                const { preset, mute, source, volume } = minidsp
                socket.send(JSON.stringify({ preset, source, volume, power }))
            }).catch(console.log)
        }, 3000)
        socket.on("close", () => {
            console.log("closing...")
            clearInterval(interval)
        })
    })
    fastify.post("/volume/:volume", (req, reply) => {
        const { volume } = req.params
        setMinidspVol(volume).then(() => {
            reply.send({ success: true })
        }).catch((e) => {
            reply.send({ success: false, message: e })
        })
    })
    fastify.post("/preset/:preset", (req, reply) => {
        const { preset } = req.params
        setMinidspPreset(preset).then(() => {
            reply.send({ success: true })
        }).catch((e) => {
            reply.send({ success: false, message: e })
        })
    })
    fastify.post("/power/on", (req, reply) => {
        powerOn(usbIndex).then(() => {
            reply.send({ success: true })
        }).catch((e) => {
            reply.send({ success: false, message: e })
        })
    })
    fastify.post("/power/off", (req, reply) => {
        powerOff(usbIndex).then(() => {
            reply.send({ success: true })
        }).catch((e) => {
            reply.send({ success: false, message: e })
        })
    })
})

fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, 'build'),
    prefix: '/', // optional: default '/'
})

// Run the server!
try {
    fastify.listen({ port: 4000, host: '0.0.0.0' })
} catch (err) {
    fastify.log.error(err)
}