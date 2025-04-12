'use strict'

const { execFile } = require('child_process');
const { createBluetooth } = require('node-ble')
const { bluetooth, destroy } = createBluetooth()
const HID = require('node-hid');

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


const findDevice = async (adapter, deviceName) => {
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


const loopForDevice = async (adapter, deviceName) => {
    let device = null
    if (!await adapter.isDiscovering()) {
        await adapter.startDiscovery()
    }
    device = await findDevice(adapter, deviceName)
    while (!device) {
        await new Promise((res) => setTimeout(res, 1000))
        device = await findDevice(adapter, deviceName)
    }
    return device
}

const session = async (device) => {
    console.log("device connecting")
    if (!await device.isConnected()) {
        await device.connect()
    }
    console.log("device connected!")
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

    return new Promise((res) => {
        hid.on("error", function (err) {
            //this runs when bluetooth device is turned off
            console.log(err)
            device.disconnect().catch(console.log).then(() => {
                //destroy()
                res("session ended")
            })
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