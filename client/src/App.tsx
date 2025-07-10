import { useEffect, useCallback, useMemo } from "react";
import "./App.css";
import { ThemeProvider } from "@mui/material/styles";

import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Toolbar from "@mui/material/Toolbar";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import {
  Power,
  setVolume,
  setPreset,
  setPower,
  Preset,
  getStatus,
  Source,
  setSource,
  volumeUp,
  volumeDown,
  HtxWrite,
  addAuthHeaders,
  LocalHeaders,
  User,
  AuthSettings,
} from "./services/api";
import { Outlet, useLoaderData } from "react-router";

import StatusCard from "./components/PowerCard";
import VolumeCard from "./components/VolumeCard";
import AppBar from "./components/AppBar";
import {
  MinidspAction,
  useMiniDspParams,
  Action,
} from "./state/minidspActions";
import { SetKeys, useAuthSettingsParams } from "./state/credActions";
import { useUserParams, SetUser } from "./state/userActions";
import {
  saveColorTheme,
} from "./state/persistance";

import { ColorTheme, themes } from "./styles/modes";
import SSLNotification from "./components/SSLNotification";
import NoUserNotification from "./components/NoUserNotification";
import { refreshStatus, refreshToken, useInterval } from "./utils/refresh";
import { SetTheme, useThemeParams } from "./state/themeActions";
interface InitialLoad {
  user: User,
  authSettings: AuthSettings
}
// custom hook for parameter updates
function useParameterUpdates(
  miniDspDispatch: (_: Action) => void,
  miniDspParams: HtxWrite,
  headers: LocalHeaders,
) {
  return useMemo(
    () => ({
      updatePreset: (preset: Preset) => {
        miniDspDispatch({
          type: MinidspAction.UPDATE,
          value: { ...miniDspParams, preset },
        });
        setPreset(headers, preset);
      },
      updateVolume: (volume: number) => {
        miniDspDispatch({
          type: MinidspAction.UPDATE,
          value: { ...miniDspParams, volume },
        });
        setVolume(headers, volume);
      },
      volumeUp: (volume: number, increment: number) => {
        miniDspDispatch({
          type: MinidspAction.UPDATE,
          value: { ...miniDspParams, volume: volume + increment },
        });
        volumeUp(headers);
      },
      volumeDown: (volume: number, increment: number) => {
        miniDspDispatch({
          type: MinidspAction.UPDATE,
          value: { ...miniDspParams, volume: volume - increment },
        });
        volumeDown(headers);
      },
      updatePower: (power: Power) => {
        miniDspDispatch({
          type: MinidspAction.UPDATE,
          value: { ...miniDspParams, power },
        });
        setPower(headers, power);
      },
      updateSource: (source: Source) => {
        miniDspDispatch({
          type: MinidspAction.UPDATE,
          value: { ...miniDspParams, source },
        });
        setSource(headers, source);
      },
    }),
    [miniDspDispatch, miniDspParams, headers],
  );
}

const THREE_SECONDS = 3000
//const TWENTY_FIVE_MINUTES = 1500000

//testing
const TWENTY_FIVE_MINUTES = 150000
function App() {
  const {
    authSettings,
    user
  } = useLoaderData<InitialLoad>()

  const {
    dispatch: miniDspDispatch,
    state: miniDspParams } = useMiniDspParams();

  const {
    state: { requireAuth, certInfo },
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
  useEffect(() => {
    getStatus(addAuthHeaders(user.userId, user.jwt)).then((status) =>
      miniDspDispatch({ type: MinidspAction.UPDATE, value: status }),
    )
  }, [miniDspDispatch, user]);


  const getParams = useCallback(
    () =>
      getStatus(addAuthHeaders(userId, jwt)).then((status) =>
        miniDspDispatch({ type: MinidspAction.UPDATE, value: status }),
      ),
    [miniDspDispatch, userId, jwt],
  );


  const updates = useParameterUpdates(
    miniDspDispatch,
    miniDspParams,
    addAuthHeaders(userId, jwt),
  );
  useInterval(() => {
    refreshStatus(jwt, requireAuth, getParams)
  }, THREE_SECONDS)
  useInterval(() => refreshToken(requireAuth).then((user: User) => {
    jwt !== "" && userDispatch({
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
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 12, lg: 12 }}>
                <StatusCard
                  onPowerToggle={updates.updatePower}
                  power={miniDspParams.power}
                  preset={miniDspParams.preset}
                  source={miniDspParams.source}
                  onPresetChange={updates.updatePreset}
                  onSourceChange={updates.updateSource}
                  mode={selectedTheme}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 6 }}>
                <VolumeCard
                  onVolumeSet={updates.updateVolume}
                  onVolumeUp={updates.volumeUp}
                  onVolumeDown={updates.volumeDown}
                  volume={miniDspParams.volume}
                  mode={selectedTheme}
                />
              </Grid>
            </Grid>
          </Container>
          {certInfo && (
            <SSLNotification sslInfo={certInfo} currentDate={new Date()} />
          )}
          <NoUserNotification signature={jwt} />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
