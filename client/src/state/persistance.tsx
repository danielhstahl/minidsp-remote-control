import { ColorTheme } from "../styles/modes";

const KEY = "mode";
const RSA_KEY = "rsa_key";
export const saveColorTheme = (mode: ColorTheme) =>
  localStorage.setItem(KEY, mode);
export const getColorTheme = () =>
  localStorage.getItem(KEY) as ColorTheme | null;

export const savePrivateKey = (privateKey: string) =>
  localStorage.setItem(RSA_KEY, privateKey);

export const getPrivateKey = () => localStorage.getItem(RSA_KEY) as string;
