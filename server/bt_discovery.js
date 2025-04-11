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
    devices.forEach((deviceUuid) => {
        console.log(deviceUuid)
        adapter.waitDevice(deviceUuid).then(device => {
            Promise.all([device.getName(), device.getAlias()]).then(([name, alias]) => {
                console.log("Device:", name, alias)
            })
        })
    })

}

doBt()