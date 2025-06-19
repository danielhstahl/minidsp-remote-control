import { useEffect, useCallback, useRef, useMemo, useState } from "react";
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
  getAuthSettings,
  HtxWrite,
  addAuthHeaders,
  LocalHeaders,
  AuthSettings,
} from "./services/api";
import StatusCard from "./components/PowerCard";
import VolumeCard from "./components/VolumeCard";
import AppBar from "./components/AppBar";
import {
  MinidspAction,
  useMiniDspParams,
  Action,
} from "./state/minidspActions";
import { SetKeys, useAuthSettingsParams } from "./state/credActions";
import { SetUser, useUserParams } from "./state/userActions";
import {
  saveColorTheme,
  getColorTheme,
  getPrivateKey,
  getUserId,
} from "./state/persistance";

import { ColorTheme, DEFAULT_COLOR_THEME, themes } from "./styles/modes";
import Settings from "./components/Settings";
import SSLNotification from "./components/SSLNotification";
import NoUserNotification from "./components/NoUserNotification";
import { sign } from "./services/keyCreation";
// custom hook for parameter updates
function useParameterUpdates(
  miniDspDispatch: (_: Action) => void,
  miniDspParams: HtxWrite,
  headers: LocalHeaders,
  resetRefresh: React.MutableRefObject<NodeJS.Timeout | undefined>,
) {
  return useMemo(
    () => ({
      updatePreset: (preset: Preset) => {
        miniDspDispatch({
          type: MinidspAction.UPDATE,
          value: { ...miniDspParams, preset },
        });
        setPreset(headers, preset);
        clearInterval(resetRefresh.current);
      },
      updateVolume: (volume: number) => {
        miniDspDispatch({
          type: MinidspAction.UPDATE,
          value: { ...miniDspParams, volume },
        });
        setVolume(headers, volume);
        clearInterval(resetRefresh.current);
      },
      volumeUp: (volume: number, increment: number) => {
        miniDspDispatch({
          type: MinidspAction.UPDATE,
          value: { ...miniDspParams, volume: volume + increment },
        });
        volumeUp(headers);
        clearInterval(resetRefresh.current);
      },
      volumeDown: (volume: number, increment: number) => {
        miniDspDispatch({
          type: MinidspAction.UPDATE,
          value: { ...miniDspParams, volume: volume - increment },
        });
        volumeDown(headers);
        clearInterval(resetRefresh.current);
      },
      updatePower: (power: Power) => {
        miniDspDispatch({
          type: MinidspAction.UPDATE,
          value: { ...miniDspParams, power },
        });
        setPower(headers, power);
        clearInterval(resetRefresh.current);
      },
      updateSource: (source: Source) => {
        miniDspDispatch({
          type: MinidspAction.UPDATE,
          value: { ...miniDspParams, source },
        });
        setSource(headers, source);
        clearInterval(resetRefresh.current);
      },
    }),
    [miniDspDispatch, miniDspParams, resetRefresh, headers],
  );
}

function App() {
  /// Params state management
  const { dispatch: miniDspDispatch, state: miniDspParams } =
    useMiniDspParams();

  const {
    state: { certInfo },
    dispatch: authDispatch,
  } = useAuthSettingsParams();

  const {
    state: { userId, signature },
  } = useUserParams();

  const holdRefresh = useRef<undefined | ReturnType<typeof setTimeout>>(
    undefined,
  );

  const getParams = useCallback(
    () =>
      getStatus(addAuthHeaders(userId, signature)).then((status) =>
        miniDspDispatch({ type: MinidspAction.UPDATE, value: status }),
      ),
    [miniDspDispatch, userId, signature],
  );

  const getParamsLater = useCallback(() => {
    holdRefresh.current = setTimeout(() => {
      getParams();
    }, 3000);
  }, [getParams]);

  const updates = useParameterUpdates(
    miniDspDispatch,
    miniDspParams,
    addAuthHeaders(userId, signature),
    holdRefresh,
  );

  useEffect(() => {
    //on initial load, get params immediately
    getParams();
    //get "ground truth" from Minidsp on a periodic basis
    //if any UI action impacting state is made, then getParams is canceled
    setInterval(() => {
      if (holdRefresh.current !== undefined) {
        clearTimeout(holdRefresh.current);
      }
      getParamsLater(); //gets Params in 3000 ms, unless timeout is cleared by UI action
    }, 5000); //has to be longer than the getParamsLater timeout
  }, [getParams, getParamsLater]);

  /// Theme state management
  const [selectedTheme, setSelectedTheme] = useState<ColorTheme>(
    getColorTheme() || DEFAULT_COLOR_THEME,
  );
  const setThemeAndSave = (theme: ColorTheme) => {
    setSelectedTheme(theme);
    saveColorTheme(theme);
  };
  const theme = themes[selectedTheme];

  const { dispatch: userDispatch } = useUserParams();

  useEffect(() => {
    //no need for authentication on this endpoint
    getAuthSettings({})
      .then((result: AuthSettings) => {
        authDispatch({
          type: SetKeys.UPDATE,
          value: result,
        });
        return result.stringToSign;
      })
      .then((stringToSign: string) => {
        const privateKey = getPrivateKey() || "";
        return sign(stringToSign, privateKey);
      })
      .then((signature) => {
        const userId = getUserId();
        userDispatch({
          type: SetUser.UPDATE,
          value: {
            userId,
            signature,
          },
        });
      });
  }, [authDispatch, userDispatch]);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar mode={selectedTheme} setMode={setThemeAndSave} />
        <Settings mode={selectedTheme} />
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
          <NoUserNotification signature={signature} />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
