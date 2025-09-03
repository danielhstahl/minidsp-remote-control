import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import StatusCard from "../components/PowerCard";
import VolumeCard from "../components/VolumeCard";
import { useNavigate, useLoaderData } from "react-router";
import type { HtxWrite } from "../services/api";

const THREE_SECONDS = 3000;

const AppBody = () => {
  const { power, source, volume, preset } = useLoaderData<HtxWrite>();
  const navigate = useNavigate();
  setTimeout(() => {
    console.log("got to the place where I need to navigate");
    navigate("/app"); //refetch status every 3 seconds
  }, THREE_SECONDS);
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 12, lg: 12 }}>
          <StatusCard power={power} preset={preset} source={source} />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 6 }}>
          <VolumeCard volume={volume} />
        </Grid>
      </Grid>
    </Container>
  );
};
export default AppBody;
