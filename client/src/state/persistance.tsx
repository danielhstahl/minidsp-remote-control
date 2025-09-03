import { DEFAULT_COLOR_THEME } from "../styles/modes";
import type { ColorTheme } from "../styles/modes";
const KEY = "mode";
export const saveColorTheme = (mode: ColorTheme) =>
  localStorage.setItem(KEY, mode);
export const getColorTheme = () =>
  (localStorage.getItem(KEY) as ColorTheme) || DEFAULT_COLOR_THEME;
