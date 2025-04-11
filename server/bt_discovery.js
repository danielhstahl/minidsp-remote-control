'use strict'

const { createBluetooth } = require('node-ble')
const { bluetooth } = createBluetooth()

const doBt = async () => {
    const adapter = await bluetooth.defaultAdapter()
    if (! await adapter.isDiscovering())
        await adapter.startDiscovery()

    btDevices.forEach((deviceUuid) => {
        adapter.waitDevice(deviceUuid).then(device => {
            Promise.all([device.getName(), device.getAlias()]).then(([name, alias]) => {
                console.log("Device:", name, alias)
            })
        })
    })

}

doBt()