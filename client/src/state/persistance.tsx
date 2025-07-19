import { DEFAULT_COLOR_THEME } from "../styles/modes";
import type { ColorTheme } from "../styles/modes";
const KEY = "mode";
const RSA_KEY = "rsa_key";
const USER_ID_KEY = "user_key";
export const saveColorTheme = (mode: ColorTheme) =>
  localStorage.setItem(KEY, mode);
export const getColorTheme = () =>
  localStorage.getItem(KEY) as ColorTheme || DEFAULT_COLOR_THEME;

export const savePrivateKey = (privateKey: string) =>
  localStorage.setItem(RSA_KEY, privateKey);

export const getPrivateKey = () => localStorage.getItem(RSA_KEY) || "" as string;

export const saveUserId = (userId: string) =>
  localStorage.setItem(USER_ID_KEY, userId);

export const getUserId = () => localStorage.getItem(USER_ID_KEY) || "-1" as string;
