import { useEffect } from "react";
import "./App.css";
import { ThemeProvider } from "@mui/material/styles";

import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Toolbar from "@mui/material/Toolbar";


import {
  User,
  AuthSettings
} from "./services/api";
import { Outlet, useLoaderData } from "react-router";

import AppBar from "./components/AppBar";

import { SetKeys, useAuthSettingsParams } from "./state/credActions";
import { useUserParams, SetUser } from "./state/userActions";
import {
  saveColorTheme,
} from "./state/persistance";
import { MiniDspProvider } from "./state/minidspActions";
import { ExpiryProvider } from "./state/expiryActions";
import { ColorTheme, themes } from "./styles/modes";
import SSLNotification from "./components/SSLNotification";
import NoUserNotification from "./components/NoUserNotification";
import { refreshToken, useInterval } from "./utils/refresh";
import { SetTheme, useThemeParams } from "./state/themeActions";

import AppBody from "./components/AppBody";
interface InitialLoad {
  user: User,
  authSettings: AuthSettings
}

const TWENTY_FIVE_MINUTES = 1500000
function App() {
  const {
    authSettings,
    user
  } = useLoaderData<InitialLoad>()

  const {
    state: { requireAuth, domainName },
    dispatch: authDispatch,
  } = useAuthSettingsParams();
  const {
    state: { userId, jwt },
    dispatch: userDispatch
  } = useUserParams();

  useEffect(() => {
    authDispatch({
      type: SetKeys.UPDATE,
      value: authSettings
    })
  }, [authDispatch, authSettings]);

  useEffect(() => {
    userDispatch({
      type: SetUser.UPDATE,
      value: user
    })
  }, [userDispatch, user]);

  useInterval(() => refreshToken(requireAuth, domainName).then((user: User) => {
    userDispatch({
      type: SetUser.UPDATE,
      value: user,
    });
  }), TWENTY_FIVE_MINUTES)

  const {
    dispatch: themeDispatch,
    state: selectedTheme
  } = useThemeParams();

  const setThemeAndSave = (theme: ColorTheme) => {
    themeDispatch({ type: SetTheme.UPDATE, value: theme });
    saveColorTheme(theme);
  };
  const theme = themes[selectedTheme];
  const activeJwt = jwt === "" ? user.jwt : jwt
  const activeUserId = jwt === "" ? user.userId : userId
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar mode={selectedTheme} setMode={setThemeAndSave} />
        <Outlet />
        <Box
          component="main"
          sx={{
            backgroundColor: (theme) => theme.palette.background.default,
            flexGrow: 1,
            height: "100vh",
            overflow: "auto",
          }}
        >
          <Toolbar />
          <MiniDspProvider>
            <AppBody jwt={activeJwt} userId={activeUserId} requireAuth={requireAuth} />
          </MiniDspProvider>
          <ExpiryProvider>
            <SSLNotification currentDate={new Date()} />
          </ExpiryProvider>
          <NoUserNotification signature={jwt} />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
