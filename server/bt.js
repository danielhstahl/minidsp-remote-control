'use strict'

const { execFile } = require('child_process');
const { createBluetooth } = require('node-ble')
const { bluetooth } = createBluetooth()
const HID = require('node-hid');
const TIMEOUT_MS = 1000
const HID_DEVICE_ID = 2007
const HID_VENDOR_ID = 0
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

const _findDevice = async (adapter, deviceName) => {
    const devices = await adapter.devices()
    const results = await Promise.all(devices.map(deviceUuid => {
        return adapter.waitDevice(deviceUuid).then(device => {
            return device.getAlias().catch(e => e.toString()).then(name => {
                return { isDevice: name === deviceName, device }
            })
        })
    }))
    return results.find(result => result.isDevice)?.device
}

const secondTimeout = async () => await new Promise((res) => setTimeout(res, TIMEOUT_MS))
const loopForDevice = async (adapter, deviceName) => {
    let device = null
    if (!await adapter.isDiscovering()) {
        await adapter.startDiscovery()
    }
    device = await _findDevice(adapter, deviceName)
    while (!device) {
        await secondTimeout()
        device = await _findDevice(adapter, deviceName)
    }
    return device
}
//will loop until connection is established; if VOL20 is turned off will loop indefinitely
const loopForConnection = async (device) => {
    while (!await device.isConnected()) {
        try {
            //I wish there was a way to check that device was available without waiting for it to error...
            await device.helper.callMethod('Connect')
        }
        catch (exception) {
            //it is expected to get here if device has been disconnected
        }
        await secondTimeout()
    }
}
const hidSession = async () => {
    const hid = await HID.HIDAsync.open(HID_DEVICE_ID, HID_VENDOR_ID);
    hid.on("data", function (data) {
        const [dataType] = data
        if (dataType === 1) { ///volume down
            setMinidspVol(-1)
        }
        if (dataType === 2) { ///volume up
            setMinidspVol(1)
        }
    });
    return new Promise((res) => {
        hid.on("error", function (err) {
            //error is invoked when bluetooth device is turned off
            console.log(err)
            hid.close()
            res("session ended")
        })
    })
}

const doBt = async () => {
    const adapter = await bluetooth.defaultAdapter()
    while (true) { //one loop per "session" (VOL20 on and active/connected)
        console.log("getting device")
        const device = await loopForDevice(adapter, "VOL20")
        console.log("device obtained")
        console.log("device connecting...")
        await loopForConnection(device)
        console.log("device connected!")
        await hidSession(device) //waits until session is finished (disconnected)
        await device.disconnect()
        console.log("session ended")
    }
}

doBt()