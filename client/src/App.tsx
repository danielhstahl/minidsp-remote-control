import { useEffect } from 'react';
import './App.css';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import {
  Source,
  Power,
  postRequest,
  Preset,
  getWebSocket,
  HtxWrite,
} from './services/api'
import StatusCard from './components/PowerCard';
import VolumeCard from './components/VolumeCard';
import AppBar from './components/AppBar';
import SourceCard from './components/SourceCard';
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
  useEffect(() => {
    getWebSocket((status: HtxWrite) => {
      writeDispatch({ type: WriteAction.UPDATE, value: status })
    })
  }, [writeDispatch])

  const updateSource = (source: Source) => {
    writeDispatch({ type: WriteAction.UPDATE, value: { ...writeParams, source } })
    postRequest({ source })
  }
  const updatePreset = (preset: Preset) => {
    writeDispatch({ type: WriteAction.UPDATE, value: { ...writeParams, preset } })
    postRequest({ preset })
  }
  const updateVolume = (volume: number) => {
    writeDispatch({ type: WriteAction.UPDATE, value: { ...writeParams, volume } })
    postRequest({ volume })
  }
  console.log(writeParams)

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
                  //onPowerToggle={onPowerToggle}
                  power={true}
                  onSourceChange={updateSource}
                  preset={writeParams.preset}
                  onPresetChange={updatePreset}
                  source={writeParams.source}
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
