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
    Promise.all(devices.map((deviceUuid) => {
        console.log(deviceUuid)
        return adapter.waitDevice(deviceUuid).then(device => {
            return device.getAlias().catch(e => e.toString()).then((alias) => {
                console.log("Device alias:", alias)
            })
        })
    })).then(() => console.log("got them all"))

}

doBt()