import {
  setVolume,
  volumeUp,
  volumeDown,
  setPreset,
  setPower,
  setSource,
  generateCert,
} from "./api";
import { type Source, type Power, type Preset } from "../types";
import { extractValueFromFormData } from "../utils/fetcherUtils";
import { type ActionFunctionArgs } from "react-router";
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

export const certAction = async () => {
  try {
    const result = await generateCert();
    return result;
  } catch (error) {
    console.log(error);
    return { error };
  }
};
