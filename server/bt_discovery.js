'use strict'
const { execFile } = require('child_process');
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
        await device.connect()
        return true
    })).then(() => console.log("got them all"))
}

doBt()
/*
function setMinidspVol(gain) {
    return new Promise((res, rej) => execFile(`minidsp`, ['gain', '--relative', '--', gain], (err, stdout, stderr) => {
        if (err) {
            rej(err)
        }
        else {
            res()
        }
    }))
}
*/

/*
const HID = require('node-hid');
const doHid = async () => {
    while (true) {
        try {
            const hid = await HID.HIDAsync.open(2007, 0);

            hid.on("data", function (data) {
                const [dataType] = data
                if (dataType === 1) { ///volume down
                    console.log("VOL DOWN")
                    setMinidspVol(-1)
                }
                if (dataType === 2) { ///volume up
                    console.log("VOL UP")
                    setMinidspVol(1)
                }
            });
            await new Promise((res) => {
                hid.on("error", function (err) {
                    //this runs when bluetooth device is turned off
                    res("session ended")
                })
            })
        }
        catch (exception) {
            console.log("No device")
        }
        await new Promise((res) => setTimeout(res, 1000))
    }

}


doHid()
*/
