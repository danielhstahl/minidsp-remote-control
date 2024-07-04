import { ColorTheme } from "../styles/modes";

const KEY = "mode"
export const saveColorTheme = (mode: ColorTheme) => localStorage.setItem(KEY, mode)
export const getColorTheme = () => localStorage.getItem(KEY) as ColorTheme | null