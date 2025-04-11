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
                return { isDevice: name === deviceName, device, deviceUuid }
            })
        })
    })).then((results) => {
        return results.find(result => result.isDevice)
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
            return findDevice(adapter, deviceName)
        })
    })
}



const loopForDevice = async (adapter, deviceName) => {
    let device = null
    device = await whileDeviceNotFound(adapter, deviceName)
    while (!device) {
        await new Promise((res) => setTimeout(res, 1000))
        device = await whileDeviceNotFound(adapter, deviceName)
    }
    const { device: deviceInstance, deviceUuid } = device
    return { device: deviceInstance, deviceUuid }
}
const session = async (device, deviceUuid) => {
    console.log("device connecting")
    if (!await device.isConnected()) {
        await device.connect()
    }
    console.log("device connected!")
    if (!await device.isPaired()) {
        await device.pair()
    }
    console.log("device paired!")
    const gattServer = await device.gatt()
    console.log("server launched")
    const services = await gattServer.services()
    console.log("services")
    console.log(services)

    const service2 = await gattServer.getPrimaryService(deviceUuid)
    const characteristics = await gattServer.characteristics()
    console.log(characteristics)
    return new Promise((res) => {
        device.on("disconnect", () => {
            res("session ended")
        })
    })
}

const doBt = async () => {
    const adapter = await bluetooth.defaultAdapter()
    while (true) {
        console.log("getting device")
        const { device, deviceUuid } = await loopForDevice(adapter, "VOL20")
        console.log("device obtained")
        await session(device, deviceUuid) //waits until session is finished (disconnected)
    }
    //const gattServer = await deviceInstance.gatt()
    //const service2 = await gattServer.getPrimaryService(deviceUuid)
    //const characteristics = await gattServer.characteristics()
    //console.log(characteristics)
    /*const characteristic2 = await service2.getCharacteristic('uuid')
    characteristic2.on('valuechanged', buffer => {
        console.log(buffer)
    })
    await characteristic2.startNotifications()*/
}

doBt()