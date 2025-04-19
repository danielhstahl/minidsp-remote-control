'use strict'
const { createBluetooth } = require('node-ble')
const { bluetooth } = createBluetooth()

const doBt = async () => {
    console.log("starting adapter")
    const adapter = await bluetooth.defaultAdapter()
    console.log("starting discovery")
    if (! await adapter.isDiscovering())
        await adapter.startDiscovery()
    console.log("starting device list")
    const devices = await adapter.devices()
    Promise.all(devices.map(async (deviceUuid) => {
        console.log(deviceUuid)
        const device = await adapter.waitDevice(deviceUuid)
        const alias = await device.getAlias()
        console.log("Device alias:", alias)
        if (alias === "VOL20") {
            const gattServer = await device.gatt()
            const characteristics = await gattServer.characteristics()
            console.log(characteristics)
        }
        return true
    })).then(() => console.log("got them all"))
}



doBt()
