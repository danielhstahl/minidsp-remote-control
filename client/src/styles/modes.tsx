import { Theme } from "@mui/material";

export type ColorTheme = "light" | "dark" | "dark_evil"
export type Mode = "light" | "dark"
export const DEFAULT_COLOR_THEME: ColorTheme = "light"
export const THEME_TO_MODE: { [K in ColorTheme]: Mode } = {
    "light": "light",
    "dark": "dark",
    "dark_evil": "dark"
}

export const applyThemePrimaryColor = (theme: Theme, colorTheme: ColorTheme) => {
    switch (colorTheme) {
        case "light":
            return theme.palette.primary.light
        case "dark":
            return theme.palette.primary.dark
        case "dark_evil":
            return theme.palette.error.dark
    }
}

export const applyThemePrimaryType = (colorTheme: ColorTheme) => {
    switch (colorTheme) {
        case "light":
            return "primary"
        case "dark":
            return "primary"
        case "dark_evil":
            return "error"
    }
}

export const applyThemeSecondaryColor = (theme: Theme, colorTheme: ColorTheme) => {
    switch (colorTheme) {
        case "light":
            return theme.palette.grey[200]
        case "dark":
            return theme.palette.grey[800]
        case "dark_evil":
            return theme.palette.grey[800]
    }
}

export const applyThemeBackgroundColor = (theme: Theme, colorTheme: ColorTheme) => {
    switch (colorTheme) {
        case "light":
            return theme.palette.grey[100]
        case "dark":
            return theme.palette.grey[900]
        case "dark_evil":
            return theme.palette.grey[900]
    }
}