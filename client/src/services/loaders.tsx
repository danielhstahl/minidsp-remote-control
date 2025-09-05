import {
  getStatus,
  loadDevice,
  getDevices,
  addBasicAuthHeader,
  getExpiry,
} from "./api";
import { redirect } from "react-router";

export const authAndExpiryLoader = async () => {
  //no auth needed on these endpoints
  const [device, expiry] = await Promise.all([loadDevice(), getExpiry()]);
  if (!device.isAllowed) {
    return redirect("/login");
  } else {
    return expiry;
  }
};

export const statusLoader = async () => {
  const status = await getStatus();
  return status;
};

//does this automatically retrigger after an action is called?
export const devicesLoader = async () => {
  const adminPassword = sessionStorage.getItem("admin_password");
  try {
    const devices = await getDevices(
      addBasicAuthHeader(adminPassword as string),
    );
    return devices;
  } catch (error) {
    console.log(error);
    sessionStorage.clear();
    return redirect("/login");
  }
};
