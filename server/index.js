'use strict'
const Fastify = require('fastify')
const { execFile } = require('child_process');
const { env: { USB_INDEX } } = require("process")
const path = require("path")
const gpio = require('rpi-gpio')
const fastify = Fastify({
    logger: true
})

const usbIndex = USB_INDEX || 2

//gpio:
//01 is 26
//02 is 20
//03 is 21
const RELAY_1 = 26
gpio.setup(RELAY_1, gpio.DIR_OUT);

//for me usbIndex is "2", run `uhubctl` to get a list of usb ports
//uhubctl is assumed to be in your path, and index.js needs to run as root
//see https://www.byfarthersteps.com/6802/
function powerOff() {
    return new Promise((res, rej) => gpio.write(RELAY_1, false, (err) => {
        if (err) rej(err)
        console.log('Written false to pin');
        res()
    }))

    /*return new Promise((res, rej) => execFile(
        `uhubctl`,
        ['-l', '1-1', '-p', usbIndex, '-a', 'off'],
        (err, stdout, stderr) => {
            if (err) {
                rej(err)
            }
            else {
                res(stdout)
            }
        }))*/
}

function powerOn() {
    return new Promise((res, rej) => gpio.write(RELAY_1, true, (err) => {
        if (err) rej(err)
        console.log('Written True to pin');
        res()
    }))

    /*return new Promise((res, rej) => execFile(
        `uhubctl`,
        ['-l', '1-1', '-p', usbIndex, '-a', 'off'],
        (err, stdout, stderr) => {
            if (err) {
                rej(err)
            }
            else {
                res(stdout)
            }
        }))*/
}

//for me usbIndex is "2", run `uhubctl` to get a list of usb ports
//uhubctl is assumed to be in your path, and index.js needs to run as root
//see https://www.byfarthersteps.com/6802/
/*function powerOn(usbIndex) {
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
}*/

//for me usbIndex is "2", run `uhubctl` to get a list of usb ports
//uhubctl is assumed to be in your path, and index.js needs to run as root
//see https://www.byfarthersteps.com/6802/
function powerStatus() {
    return new Promise((res, rej) => gpio.read(RELAY_1, (err, result) => {
        if (err) rej(err)
        console.log("power status")
        console.log(result)
        res(result ? "on" : "off")
    }))
    /*return new Promise((res, rej) => execFile(
        `uhubctl`,
        ['-l', '1-1', '-p', usbIndex],
        (err, stdout, stderr) => {
            if (err) {
                rej(err)
            }
            else {
                res(stdout.search("off") === -1 ? "on" : "off")
            }
        }))*/
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

function incrementMinidspVol(gain) {
    return new Promise((res, rej) => execFile(`minidsp`, ['gain', '--relative', '--', gain], (err, stdout, stderr) => {
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

function setMinidspInput(source) {
    // note that the source output from minidspStatus has first letter capitalized, 
    // but setting the source requires lowercase
    // see https://minidsp-rs.pages.dev/cli/master/source
    return new Promise((res, rej) => execFile(`minidsp`, ['source', source.toLowerCase()], (err, stdout, stderr) => {
        if (err) {
            rej(err)
        }
        else {
            res()
        }
    }))
}
const VOLUME_INCREMENT = 0.5
fastify.register(async function (fastify) {
    fastify.get('/status', (req, reply) => {
        Promise.all([
            minidspStatus(),
            powerStatus()
        ]).then(([minidsp, power]) => {
            const { preset, mute, source, volume } = minidsp
            reply.send({ preset, source, volume, power })
        }).catch((e) => {
            reply.send({ success: false, message: e })
        })
    })
    fastify.post("/volume/up", (req, reply) => {
        incrementMinidspVol(VOLUME_INCREMENT).then(() => {
            reply.send({ success: true })
        }).catch((e) => {
            reply.send({ success: false, message: e })
        })
    })
    fastify.post("/volume/down", (req, reply) => {
        incrementMinidspVol(-VOLUME_INCREMENT).then(() => {
            reply.send({ success: true })
        }).catch((e) => {
            reply.send({ success: false, message: e })
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
    fastify.post("/source/:source", (req, reply) => {
        const { source } = req.params
        setMinidspInput(source).then(() => {
            reply.send({ success: true })
        }).catch((e) => {
            reply.send({ success: false, message: e })
        })
    })
    fastify.post("/power/on", (req, reply) => {
        powerOn().then(() => {
            reply.send({ success: true })
        }).catch((e) => {
            reply.send({ success: false, message: e })
        })
    })
    fastify.post("/power/off", (req, reply) => {
        powerOff().then(() => {
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