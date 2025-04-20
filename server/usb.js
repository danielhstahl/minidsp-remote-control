'use strict'
const { execFile } = require('child_process');
const HID = require('node-hid');
const TIMEOUT_MS = 1000
const HID_DEVICE_ID = 4366
const HID_VENDOR_ID = 3669
const secondTimeout = async () => await new Promise((res) => setTimeout(res, TIMEOUT_MS))

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
const loopGetHid = async () => {
    while (true) {
        try {
            const hid = await HID.HIDAsync.open(HID_DEVICE_ID, HID_VENDOR_ID);
            return hid
        }
        catch (exception) {
            console.log(exception)
            var devices = await HID.devicesAsync();
            console.log(devices)
        }
        await secondTimeout()
    }
}
const hidSession = async () => {
    const hid = await loopGetHid()
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

hidSession()