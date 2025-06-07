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
  getCertInfo,
  getAuthSettings,
  SSLCert,
  HtxWrite,
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

import { saveColorTheme, getColorTheme } from "./state/persistance";

import { ColorTheme, DEFAULT_COLOR_THEME, themes } from "./styles/modes";
import Settings from "./components/Settings";
import SSLNotification from "./components/Notification";

// custom hook for parameter updates
function useParameterUpdates(
  miniDspDispatch: (_: Action) => void,
  miniDspParams: HtxWrite,
  resetRefresh: React.MutableRefObject<NodeJS.Timeout | undefined>,
) {
  return useMemo(
    () => ({
      updatePreset: (preset: Preset) => {
        miniDspDispatch({
          type: MinidspAction.UPDATE,
          value: { ...miniDspParams, preset },
        });
        setPreset(preset);
        clearInterval(resetRefresh.current);
      },
      updateVolume: (volume: number) => {
        miniDspDispatch({
          type: MinidspAction.UPDATE,
          value: { ...miniDspParams, volume },
        });
        setVolume(volume);
        clearInterval(resetRefresh.current);
      },
      volumeUp: (volume: number, increment: number) => {
        miniDspDispatch({
          type: MinidspAction.UPDATE,
          value: { ...miniDspParams, volume: volume + increment },
        });
        volumeUp();
        clearInterval(resetRefresh.current);
      },
      volumeDown: (volume: number, increment: number) => {
        miniDspDispatch({
          type: MinidspAction.UPDATE,
          value: { ...miniDspParams, volume: volume - increment },
        });
        volumeDown();
        clearInterval(resetRefresh.current);
      },
      updatePower: (power: Power) => {
        miniDspDispatch({
          type: MinidspAction.UPDATE,
          value: { ...miniDspParams, power },
        });
        setPower(power);
        clearInterval(resetRefresh.current);
      },
      updateSource: (source: Source) => {
        miniDspDispatch({
          type: MinidspAction.UPDATE,
          value: { ...miniDspParams, source },
        });
        setSource(source);
        clearInterval(resetRefresh.current);
      },
    }),
    [miniDspDispatch, miniDspParams, resetRefresh],
  );
}

function App() {
  /// Params state management
  const { dispatch: miniDspDispatch, state: miniDspParams } =
    useMiniDspParams();

  const { dispatch: authDispatch, state: authParams } = useAuthSettingsParams();

  const holdRefresh = useRef<undefined | ReturnType<typeof setTimeout>>(
    undefined,
  );

  const getParams = useCallback(
    () =>
      getStatus().then((status) =>
        miniDspDispatch({ type: MinidspAction.UPDATE, value: status }),
      ),
    [miniDspDispatch],
  );

  const getParamsLater = useCallback(() => {
    holdRefresh.current = setTimeout(() => {
      getParams();
    }, 3000);
  }, [getParams]);

  const updates = useParameterUpdates(
    miniDspDispatch,
    miniDspParams,
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

  /// Settings state management
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  /// Cert state management
  const [certInfo, setCertInfo] = useState<SSLCert | undefined>(undefined);
  // TODO put this in a state file
  useEffect(() => {
    getCertInfo().then(setCertInfo);
  }, []);
  useEffect(() => {
    getAuthSettings().then((result) =>
      authDispatch({
        type: SetKeys.UPDATE,
        value: result,
      }),
    );
  }, [authDispatch]);
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar
          mode={selectedTheme}
          setMode={setThemeAndSave}
          settingsOpen={settingsOpen}
          setSettingsOpen={setSettingsOpen}
        />
        <Settings
          open={settingsOpen}
          setOpen={setSettingsOpen}
          mode={selectedTheme}
        />
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
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
