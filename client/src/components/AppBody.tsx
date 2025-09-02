import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import StatusCard from "./PowerCard";
import VolumeCard from "./VolumeCard";
import { useNavigate, useLoaderData } from "react-router";
import type { HtxWrite } from "../services/api";

const THREE_SECONDS = 3000;

const AppBody = () => {
  const { power, source, volume, preset } = useLoaderData<HtxWrite>();
  const navigate = useNavigate();
  setTimeout(() => {
    navigate("/app"); //refetch status every 3 seconds
  }, THREE_SECONDS);
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 12, lg: 12 }}>
          <StatusCard
            //onPowerToggle={updates.updatePower}
            power={power}
            preset={preset}
            source={source}
            //onPresetChange={updates.updatePreset}
            //onSourceChange={updates.updateSource}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 6 }}>
          <VolumeCard
            //onVolumeSet={updates.updateVolume}
            //onVolumeUp={updates.volumeUp}
            //onVolumeDown={updates.volumeDown}
            volume={volume}
          />
        </Grid>
      </Grid>
    </Container>
  );
};
export default AppBody;
