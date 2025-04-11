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
                return { isDevice: name === deviceName, device }
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
    return device
}
const GENERIC_ATTRIBUTE = "0000180a-0000-1000-8000-00805f9b34fb" //"00001801-0000-1000-8000-00805f9b34fb"
const CUSTOM_ATTRIBUTE = "00002a24-0000-1000-8000-00805f9b34fb" //"00002a05-0000-1000-8000-00805f9b34fb"

const tempGetCharacteristic = async (services) => {
    Object.entries(services).forEach(([key, value]) => {
        Object.keys(value._characteristics).forEach((cKey) => {
            try {
                value.getCharacteristic(cKey).then(cValue => {
                    //console.log(cValue)

                    cValue.on('valuechanged', buffer => {
                        console.log("key", key, "cKey", cKey, "value", buffer)
                    })
                    cValue.startNotifications()
                })

            }
            catch (exception) {
                console.log(exception)
            }
        })
    })
}

const session = async (device) => {
    console.log("device connecting")
    if (!await device.isConnected()) {
        await device.connect()
    }
    console.log("device connected!")
    //if (!await device.isPaired()) {
    //    await device.pair()
    //}
    //console.log("device paired!")
    //console.log("tx power")
    //const result = await device.getTXPower()
    //console.log(result)
    //console.log("servicedata")
    //const servicedata = await device.getServiceData()
    //console.log(servicedata)
    //console.log("manu")
    //const manu = await device.getManufacturerData()
    //console.log(manu)
    const gattServer = await device.gatt()
    console.log("server launched")
    console.log(gattServer._services)
    //tempGetCharacteristic(gattServer._services)
    const service = await gattServer.getPrimaryService(GENERIC_ATTRIBUTE)

    const characteristic = await service.getCharacteristic(CUSTOM_ATTRIBUTE)
    console.log("characteristic retrieved")
    characteristic.on('valuechanged', buffer => {
        console.log(buffer)
    })
    await characteristic.startNotifications()
    console.log("started reading notifications")
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
        const device = await loopForDevice(adapter, "VOL20")
        console.log("device obtained")
        await session(device) //waits until session is finished (disconnected)
        console.log("session ended")
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