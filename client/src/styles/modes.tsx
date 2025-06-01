import { createTheme } from "@mui/material";
export type ColorTheme = "light" | "dark" | "dark_evil";
export const DEFAULT_COLOR_THEME: ColorTheme = "light";

let darkEvilTheme = createTheme({
  palette: {
    mode: "dark",
  },
});
darkEvilTheme = createTheme(darkEvilTheme, {
  palette: {
    primary: {
      main: darkEvilTheme.palette.error.dark,
    },
    secondary: {
      main: darkEvilTheme.palette.grey[800],
    },
  },
});

let lightTheme = createTheme({
  palette: {
    mode: "light",
  },
});
lightTheme = createTheme(lightTheme, {
  palette: {
    secondary: {
      main: lightTheme.palette.grey[200],
    },
  },
});

let darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});
darkTheme = createTheme(darkTheme, {
  palette: {
    secondary: {
      main: darkTheme.palette.grey[800],
    },
  },
});

export const themes = {
  light: lightTheme,
  dark: darkTheme,
  dark_evil: darkEvilTheme,
};

export const applyThemePrimaryType = (colorTheme: ColorTheme) => {
  switch (colorTheme) {
    case "light":
      return "primary";
    case "dark":
      return "primary";
    case "dark_evil":
      return "error";
  }
};
