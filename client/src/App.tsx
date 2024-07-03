import { useEffect, useCallback, useRef } from 'react';
import './App.css';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import {
  Power,
  setVolume,
  setPreset,
  setPower,
  Preset,
  getStatus,
} from './services/api'
import StatusCard from './components/PowerCard';
import VolumeCard from './components/VolumeCard';
import AppBar from './components/AppBar';
import { WriteAction, useWriteParams } from './state/writeActions';

const mdTheme = createTheme();

/*
<Grid item xs={12} md={6} lg={6}>
  <SourceCard
    audioMode={xmcReadOnly.audioMode}
    audioInfo={xmcReadOnly.audioBits}
    audioBitstream={xmcReadOnly.audioBitstream}
    videoFormat={xmcReadOnly.videoFormat}
  />
</Grid>
*/

function App() {
  const { dispatch: writeDispatch, state: writeParams } = useWriteParams()
  const getParams = useCallback(() => getStatus().then(
    status => writeDispatch({ type: WriteAction.UPDATE, value: status })),
    [writeDispatch]
  )
  const holdRefresh = useRef<undefined | ReturnType<typeof setTimeout>>(undefined)

  const getParamsLater = useCallback(() => {
    if (holdRefresh.current !== undefined) {
      //only undefined at first load, essentially this "resets" 
      //the timeout so as not to overload the server with calls
      clearTimeout(holdRefresh.current)
    }
    //refresh after 3 seconds to give MiniDSP time to adjust 
    //and respond with correct parameters
    holdRefresh.current = setTimeout(getParams, 3000)
  }, [getParams])

  useEffect(() => {
    //on initial load, get params immediately
    getParams()
    //oncomment if MiniDSP can be adjusted outside the app
    //else the MiniDSP state and the client state can
    //become decoupled until the next command from this client
    /*setInterval(() => {
      getParamsLater()
    }, 2000)*/
  }, [getParams])


  const updatePreset = (preset: Preset) => {
    writeDispatch({ type: WriteAction.UPDATE, value: { ...writeParams, preset } })
    setPreset(preset)
    getParamsLater()
  }
  const updateVolume = (volume: number) => {
    writeDispatch({ type: WriteAction.UPDATE, value: { ...writeParams, volume } })
    setVolume(volume)
    getParamsLater()
  }

  const updatePower = (power: Power) => {
    writeDispatch({ type: WriteAction.UPDATE, value: { ...writeParams, power } })
    setPower(power)
    getParamsLater()
  }

  return (
    <ThemeProvider theme={mdTheme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar />
        <Box
          component="main"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === 'light'
                ? theme.palette.grey[100]
                : theme.palette.grey[900],
            flexGrow: 1,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          <Toolbar />
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={12} lg={12}>
                <StatusCard
                  onPowerToggle={updatePower}
                  power={writeParams.power}
                  preset={writeParams.preset}
                  onPresetChange={updatePreset}
                />
              </Grid>

              <Grid item xs={12} md={6} lg={6}>
                <VolumeCard
                  onVolumeChange={updateVolume}
                  volume={writeParams.volume}
                />
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>

    </ThemeProvider >
  );
}

export default App;
