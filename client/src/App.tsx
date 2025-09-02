import "./App.css";
import { ThemeProvider, type Theme } from "@mui/material/styles";

import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Toolbar from "@mui/material/Toolbar";

import AppBar from "./components/AppBar";

import { saveColorTheme } from "./state/persistance";

import { ExpiryProvider } from "./state/expiryActions";
import type { ColorTheme } from "./styles/modes";
import { themes } from "./styles/modes";
import SSLNotification from "./components/SSLNotification";

import { SetThemeEnum, useThemeParams } from "./state/themeActions";
import { Outlet } from "react-router";

function App() {
  /*const {
    state: { requireAuth, domainName },
    dispatch: authDispatch,
  } = useAuthSettingsParams();
  const {
    state: { userId, jwt },
    dispatch: userDispatch,
    } = useUserParams();*/

  /*useEffect(() => {
    authDispatch({
      type: SetKeys.UPDATE,
      value: authSettings,
    });
  }, [authDispatch, authSettings]);

  useEffect(() => {
    userDispatch({
      type: SetUser.UPDATE,
      value: user,
    });
    }, [userDispatch, user]);*/

  /*useInterval(
    () =>
      refreshToken(requireAuth, domainName).then((user: User) => {
        userDispatch({
          type: SetUser.UPDATE,
          value: user,
        });
      }),
    TWENTY_FIVE_MINUTES,
  );*/

  const { dispatch: themeDispatch, state: selectedTheme } = useThemeParams();

  const setThemeAndSave = (theme: ColorTheme) => {
    themeDispatch({ type: SetThemeEnum.UPDATE, value: theme });
    saveColorTheme(theme);
  };
  const theme = themes[selectedTheme];
  //const activeJwt = jwt === "" ? user.jwt : jwt;
  //const activeUserId = jwt === "" ? user.userId : userId;
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar mode={selectedTheme} setMode={setThemeAndSave} />
        <Box
          component="main"
          sx={{
            backgroundColor: (theme: Theme) => theme.palette.background.default,
            flexGrow: 1,
            height: "100vh",
            overflow: "auto",
          }}
        >
          <Toolbar />
          <Outlet />
          <ExpiryProvider>
            <SSLNotification currentDate={new Date()} />
          </ExpiryProvider>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
