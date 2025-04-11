'use strict'

const { execFile } = require('child_process');
const { createBluetooth } = require('node-ble')
const { bluetooth, destroy } = createBluetooth()


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


const findDevice = async (adapter, deviceName) => {
    const devices = await adapter.devices()
    return Promise.all(devices.map(deviceUuid => {
        return adapter.waitDevice(deviceUuid).then(device => {
            return device.getAlias().catch(e => e.toString()).then(name => {
                return { "isDevice": name === deviceName, device }
            })
        })
    })).then((results) => {
        return results.find(result => result.isDevice)?.device
    })
    /*const device = await adapter.waitDevice(uuid)
    console.log("Name")
    console.log(await device.getName())
    console.log("Alias")
    console.log(await device.getAlias())*/

}
const whileDeviceNotFound = async (adapter, deviceName) => {
    return adapter.isDiscovering().then(r => {
        return r ? null : adapter.startDiscovery().then(() => {
            return findDevice(adapter, deviceName).then(device => {
                return device
            })
        })
    })
}

const doBt = async () => {
    const adapter = await bluetooth.defaultAdapter()
    let device = null
    while (!device) {
        console.log("getting device")
        device = await whileDeviceNotFound(adapter, "VOL20")
        await Promise.resolve((res) => setTimeout(res, 1000))
    }
    await device.connect()
    device.on("disconnect", () => {

    })
    const gattServer = await device.gatt()
    const service2 = await gattServer.getPrimaryService(uuid)
    const characteristics = await gattServer.characteristics()
    console.log(characteristics)
    /*const characteristic2 = await service2.getCharacteristic('uuid')
    characteristic2.on('valuechanged', buffer => {
        console.log(buffer)
    })
    await characteristic2.startNotifications()*/
}

doBt()