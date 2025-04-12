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
        return true
    })).then(() => console.log("got them all"))

}

//doBt()
const HID = require('node-hid');
const doHid = async () => {
    var devices = await HID.devicesAsync();
    console.log(devices)

    var device = await HID.HIDAsync.open(2007, 0);
    device.on("data", function (data) {
        console.log("new data")
        console.log(data.toString())
    });
    device.on("error", function (err) {
        console.log("new error")
        console.log(err)
    });
    while (true) {
        var buf = await device.getFeatureReport(0, 3)
        console.log("getting some bufer")
        console.log(buf.toString())
        await new Promise((res) => setTimeout(res, 1000))
    }


}


doHid()
