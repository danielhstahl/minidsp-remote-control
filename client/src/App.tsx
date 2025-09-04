import "./App.css";
import { ThemeProvider } from "@mui/material/styles";

import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import { saveColorTheme } from "./state/persistance";
import type { ColorTheme } from "./styles/modes";
import { themes } from "./styles/modes";
import AppBar from "./components/AppBar";
import { SetThemeEnum, useThemeParams } from "./state/themeActions";
import { Outlet } from "react-router";

function App() {
  const { dispatch: themeDispatch, state: selectedTheme } = useThemeParams();
  const setThemeAndSave = (theme: ColorTheme) => {
    themeDispatch({ type: SetThemeEnum.UPDATE, value: theme });
    saveColorTheme(theme);
  };
  const hasAuthSet = sessionStorage.getItem("admin_password") ? true : false;
  const theme = themes[selectedTheme];
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar
          mode={selectedTheme}
          setMode={setThemeAndSave}
          isAdmin={hasAuthSet}
        />
        <Outlet />
      </Box>
    </ThemeProvider>
  );
}

export default App;
