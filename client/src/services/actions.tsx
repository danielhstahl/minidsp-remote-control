import {
  setVolume,
  volumeUp,
  volumeDown,
  setPreset,
  setPower,
  setSource,
  type Source,
  type Power,
  type Preset,
} from "./api";
import { redirect, type ActionFunctionArgs } from "react-router";
export const setVolumeAction = async ({
  request,
  params,
}: ActionFunctionArgs) => {
  const formData = await request.formData();
  const volume = formData.get("volume");
  const volumeValue = parseFloat(formData.get("volumeValue"));
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
      //if (typeof volume === "number") {
      await setVolume(volumeValue);
      //}
    }
  }

  return volumeValue;
};

export const setPresetAction = async ({ request }: ActionFunctionArgs) => {
  //const { preset } = params;
  const formData = await request.formData();
  const preset = formData.get("preset") as Preset;
  await setPreset(preset);
  return preset;
};

export const setPowerAction = async ({ request }: ActionFunctionArgs) => {
  //const { powerToTurnTo } = params;
  const formData = await request.formData();
  const power = formData.get("power") as Power;
  await setPower(power);
  return power;
};

export const setSourceAction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const source = formData.get("miniDspSource") as Source;
  await setSource(source);
  return source;
};

export const loginAction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  //const authHeaders = addBasicAuthHeader(formData.get("password") as string);
  sessionStorage.setItem("admin_password", formData.get("password") as string);
  try {
    return redirect("/settings");
  } catch (error) {
    console.log(error);
    return { error };
  }
};
