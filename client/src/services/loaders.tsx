import {
  getStatus,
  loadDevice,
  getDevices,
  addBasicAuthHeader,
  getExpiry,
} from "./api";
import { redirect } from "react-router";

export const deviceLoader = async () => {
  //no auth needed on this endpoint
  const device = await loadDevice();
  if (!device.isAllowed) {
    return redirect("/login");
  } else {
    return redirect("/app");
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
    return redirect("/login");
  }
};

export const expiryLoader = async () => {
  const expiry = await getExpiry();
  return expiry;
};
