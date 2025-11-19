import {
  setVolume,
  volumeUp,
  volumeDown,
  setPreset,
  setPower,
  setSource,
  updateDevice,
  addBasicAuthHeader,
  generateCert,
} from "./api";
import {
  type Source,
  type Power,
  type Preset,
} from "../types";
import { extractValueFromFormData } from "../utils/fetcherUtils";
import { redirect, type ActionFunctionArgs } from "react-router";
export const setVolumeAction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const { volume, volumeValue } = extractValueFromFormData(
    formData,
    "volume",
    {},
  );
  switch (volume) {
    case "up": {
      await volumeUp();
      break;
    }
    case "down": {
      await volumeDown();
      break;
    }
    default: {
      await setVolume(volumeValue);
    }
  }

  return volumeValue;
};

export const setPresetAction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const preset = formData.get("preset") as Preset;
  await setPreset(preset);
  return preset;
};

export const setPowerAction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const power = formData.get("power") as Power;
  await setPower(power);
  return power;
};

export const setSourceAction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const source = formData.get("source") as Source;
  await setSource(source);
  return source;
};

export const loginAction = async ({ request }: ActionFunctionArgs) => {
  try {
    const formData = await request.formData();
    sessionStorage.setItem(
      "admin_password",
      formData.get("password") as string,
    );
    return redirect("/settings");
  } catch (error) {
    console.log(error);
    return { error };
  }
};

export const deviceAction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const device = JSON.parse(formData.get("device") as string);
  const adminPassword = sessionStorage.getItem("admin_password");
  try {
    const result = await updateDevice(
      addBasicAuthHeader(adminPassword as string),
      device,
    );
    return result;
  } catch (error) {
    console.log(error);
    return { error };
  }
};

export const certAction = async () => {
  const adminPassword = sessionStorage.getItem("admin_password");
  try {
    const result = await generateCert(
      addBasicAuthHeader(adminPassword as string),
    );
    return result;
  } catch (error) {
    console.log(error);
    return { error };
  }
};
