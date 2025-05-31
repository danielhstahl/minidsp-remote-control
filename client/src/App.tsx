import { useEffect, useCallback, useRef, useMemo, useState } from "react";
import "./App.css";
import { createTheme, ThemeProvider } from "@mui/material/styles";
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
  SSLCert,
} from "./services/api";
import StatusCard from "./components/PowerCard";
import VolumeCard from "./components/VolumeCard";
import AppBar from "./components/AppBar";
import { WriteAction, useWriteParams } from "./state/writeActions";
import { saveColorTheme, getColorTheme } from "./state/persistance";
import {
  ColorTheme,
  applyThemeBackgroundColor,
  DEFAULT_COLOR_THEME,
  THEME_TO_MODE,
} from "./styles/modes";
import Settings from "./components/Settings";
import SSLNotification from "./components/Notification";

// custom hook for parameter updates
function useParameterUpdates(
  writeDispatch: any,
  writeParams: any,
  resetRefresh: React.MutableRefObject<NodeJS.Timeout | undefined>,
) {
  return useMemo(
    () => ({
      updatePreset: (preset: Preset) => {
        writeDispatch({
          type: WriteAction.UPDATE,
          value: { ...writeParams, preset },
        });
        setPreset(preset);
        clearInterval(resetRefresh.current);
      },
      updateVolume: (volume: number) => {
        writeDispatch({
          type: WriteAction.UPDATE,
          value: { ...writeParams, volume },
        });
        setVolume(volume);
        clearInterval(resetRefresh.current);
      },
      volumeUp: (volume: number, increment: number) => {
        writeDispatch({
          type: WriteAction.UPDATE,
          value: { ...writeParams, volume: volume + increment },
        });
        volumeUp();
        clearInterval(resetRefresh.current);
      },
      volumeDown: (volume: number, increment: number) => {
        writeDispatch({
          type: WriteAction.UPDATE,
          value: { ...writeParams, volume: volume - increment },
        });
        volumeDown();
        clearInterval(resetRefresh.current);
      },
      updatePower: (power: Power) => {
        writeDispatch({
          type: WriteAction.UPDATE,
          value: { ...writeParams, power },
        });
        setPower(power);
        clearInterval(resetRefresh.current);
      },
      updateSource: (source: Source) => {
        writeDispatch({
          type: WriteAction.UPDATE,
          value: { ...writeParams, source },
        });
        setSource(source);
        clearInterval(resetRefresh.current);
      },
    }),
    [writeDispatch, writeParams, resetRefresh],
  );
}

// custom hook for theme management
function useThemeManagement() {
  const [colorTheme, setColorTheme] = useState<ColorTheme>(
    getColorTheme() || DEFAULT_COLOR_THEME,
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: THEME_TO_MODE[colorTheme],
        },
      }),
    [colorTheme],
  );

  const setMode = useCallback((mode: ColorTheme) => {
    saveColorTheme(mode);
    setColorTheme(mode);
  }, []);

  return { theme, colorTheme, setMode };
}

function App() {
  const { dispatch: writeDispatch, state: writeParams } = useWriteParams();
  const holdRefresh = useRef<undefined | ReturnType<typeof setTimeout>>(
    undefined,
  );

  const getParams = useCallback(
    () =>
      getStatus().then((status) =>
        writeDispatch({ type: WriteAction.UPDATE, value: status }),
      ),
    [writeDispatch],
  );

  const getParamsLater = useCallback(() => {
    holdRefresh.current = setTimeout(() => {
      getParams();
    }, 3000);
  }, [getParams]);

  const { theme, colorTheme, setMode } = useThemeManagement();
  const updates = useParameterUpdates(writeDispatch, writeParams, holdRefresh);

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

  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  const [certInfo, setCertInfo] = useState<SSLCert | undefined>(undefined);
  useEffect(() => {
    getCertInfo().then(setCertInfo);
  }, []);
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar
          mode={colorTheme}
          setMode={setMode}
          settingsOpen={settingsOpen}
          setSettingsOpen={setSettingsOpen}
        />
        <Settings open={settingsOpen} setOpen={setSettingsOpen} />
        <Box
          component="main"
          sx={{
            backgroundColor: (theme) =>
              applyThemeBackgroundColor(theme, colorTheme),
            flexGrow: 1,
            height: "100vh",
            overflow: "auto",
          }}
        >
          <Toolbar />
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={12} lg={12}>
                <StatusCard
                  onPowerToggle={updates.updatePower}
                  power={writeParams.power}
                  preset={writeParams.preset}
                  source={writeParams.source}
                  onPresetChange={updates.updatePreset}
                  onSourceChange={updates.updateSource}
                  mode={colorTheme}
                />
              </Grid>
              <Grid item xs={12} md={6} lg={6}>
                <VolumeCard
                  onVolumeSet={updates.updateVolume}
                  onVolumeUp={updates.volumeUp}
                  onVolumeDown={updates.volumeDown}
                  volume={writeParams.volume}
                  mode={colorTheme}
                />
              </Grid>
            </Grid>
          </Container>
          {certInfo && (
            <SSLNotification
              sslInfo={certInfo}
              currentDate={new Date("2023-05-05")}
            />
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
