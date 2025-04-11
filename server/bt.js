'use strict'

const { execFile } = require('child_process');
const { createBluetooth } = require('node-ble')
const { bluetooth, destroy } = createBluetooth()
const adapter = await bluetooth.defaultAdapter()

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
            return device.getName().then(name => {
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
    setInterval(() => {
        adapter.isDiscovering().then(r => {
            !r && adapter.startDiscovery().then(() => {
                findDevice(adapater, deviceName).then(device => {
                    if (device) {

                        return device
                    }
                })
            })
        })
    }, 1000)
}

const doBt = async () => {

    if (! await adapter.isDiscovering())
        await adapter.startDiscovery()

    const btDevices = await adapter.devices()
    console.log(btDevices)
    const [uuid] = btDevices

    const device = await adapter.waitDevice(uuid)
    console.log("Name")
    console.log(await device.getName())
    console.log("Alias")
    console.log(await device.getAlias())
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
