'use strict'
const Fastify = require('fastify')
//const http = require('http');
//const httpProxy = require('@fastify/http-proxy')
const { exec, execFile } = require('child_process');
const { env: { /*PORT, IP,*/ USB_INDEX } } = require("process")

const fastify = Fastify({
    logger: true
})

//const upstream = `http://${IP || "localhost"}:${PORT || 5380}`
const usbIndex = USB_INDEX || 2
/*fastify.register(httpProxy, {
    upstream,
    prefix: '/api', // optional
});*/
fastify.register(require('@fastify/websocket'))

/*const options = {
    hostname: IP || "localhost",
    port: PORT || 5380,
    path: '/devices/0',
    //method: 'POST',
};*/
/*
function httpGet(options) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            method: 'GET',
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
        req.end();
    })
}*/

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
                res(stdout)
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
            res(JSON.parse(stdout))
        }
    }))
}

function setMinidspPreset(preset) { //0 indexed
    return new Promise((res, rej) => execFile(`minidsp`, ['config', preset], (err, stdout, stderr) => {
        if (err) {
            rej(err)
        }
        else {
            res(JSON.parse(stdout))
        }
    }))
}

fastify.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, (socket, req) => {
        const interval = setInterval(() => {
            Promise.all([
                /*httpGet({...options }).then((data) => {
                console.log(data.toString())
                //console.log(volume)
                //{ preset, mute, source, volume }
                //socket.send(JSON.stringify({ preset, source, volume }))
                }) */
                minidspStatus(),
                powerStatus(usbIndex)
            ]).then(([minidsp, power]) => {
                const { preset, mute, source, volume } = minidsp
                socket.send(JSON.stringify({ preset, source, volume, power }))
            })
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

// Run the server!
try {
    fastify.listen({ port: 4000, host: '0.0.0.0' })
} catch (err) {
    fastify.log.error(err)
    process.exit(1)
}