"use strict";

const { execFile } = require("child_process");
const { createBluetooth } = require("node-ble");
const { bluetooth } = createBluetooth();
//eg, hci1
const {
  env: { BLUETOOTH_DEVICE_ID },
} = require("process");
const HID = require("node-hid");
const VOLUME_INCREMENT = 0.5;
const TIMEOUT_MS = 1000;
const HID_DEVICE_ID = 0; //hex 0000
const HID_VENDOR_ID = 2007; //hex 07d7
function setMinidspVol(gain) {
  return new Promise((res, rej) =>
    execFile(
      `minidsp`,
      ["gain", "--relative", "--", gain],
      (err, _stdout, _stderr) => {
        if (err) {
          rej(err);
        } else {
          res();
        }
      },
    ),
  );
}

const _findDevice = async (adapter, deviceName) => {
  const devices = await adapter.devices();
  const results = await Promise.all(
    devices.map((deviceUuid) => {
      return adapter.waitDevice(deviceUuid).then((device) => {
        return device
          .getAlias()
          .catch((e) => e.toString())
          .then((name) => {
            return { isDevice: name === deviceName, device };
          });
      });
    }),
  );
  return results.find((result) => result.isDevice)?.device;
};

const secondTimeout = async () =>
  await new Promise((res) => setTimeout(res, TIMEOUT_MS));
const loopForDevice = async (adapter, deviceName) => {
  let device = null;
  if (!(await adapter.isDiscovering())) {
    await adapter.startDiscovery();
  }
  device = await _findDevice(adapter, deviceName);
  while (!device) {
    await secondTimeout();
    device = await _findDevice(adapter, deviceName);
  }
  return device;
};
//will loop until connection is established; if VOL20 is turned off will loop indefinitely
const loopForConnection = async (device) => {
  while (!(await device.isConnected())) {
    try {
      //I wish there was a way to check that device was available without waiting for it to error...
      await device.helper.callMethod("Connect");
    } catch (exception) {
      //it is expected to get here if device has been disconnected
    }
    await secondTimeout();
  }
};
const hidSession = async () => {
  const hid = await HID.HIDAsync.open(HID_VENDOR_ID, HID_DEVICE_ID);
  hid.on("data", function (data) {
    const [dataType] = data;
    if (dataType === 1) {
      ///volume down
      setMinidspVol(-VOLUME_INCREMENT);
    }
    if (dataType === 2) {
      ///volume up
      setMinidspVol(VOLUME_INCREMENT);
    }
  });
  return new Promise((res) => {
    hid.on("error", function (err) {
      //error is invoked when bluetooth device is turned off
      console.log(err);
      hid.close();
      res("session ended");
    });
  });
};

const doBt = async () => {
  const adapters = await bluetooth.adapters();
  if (!adapters.length) {
    throw new Error("No available adapters found");
  }
  console.log(adapters);
  //default to first if BLUETOOTH_DEVICE_ID is not found
  console.log(BLUETOOTH_DEVICE_ID);
  const adapter_name =
    adapters.find((a) => a === BLUETOOTH_DEVICE_ID) || adapters[0];
  const adapter = await bluetooth.getAdapter(adapter_name);
  const address = await adapter.getAddress();
  console.log("using adapter", adapter_name, "with id", address);
  while (true) {
    //one loop per "session" (VOL20 on and active/connected)
    console.log("getting device");
    const device = await loopForDevice(adapter, "VOL20");
    console.log("device obtained");
    console.log("device connecting...");
    await loopForConnection(device);
    console.log("device connected!");
    await hidSession(device); //waits until session is finished (disconnected)
    await device.disconnect();
    console.log("session ended");
  }
};

doBt();
