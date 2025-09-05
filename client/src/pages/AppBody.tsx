import Grid from "@mui/material/Grid";
import StatusCard from "../components/PowerCard";
import VolumeCard from "../components/VolumeCard";
import { useRevalidator, useLoaderData } from "react-router";
import type { HtxWrite } from "../services/api";
import { useEffect } from "react";
const THREE_SECONDS = 3000;

const AppBody = () => {
  const { power, source, volume, preset } = useLoaderData<HtxWrite>();
  const { revalidate } = useRevalidator();
  useEffect(() => {
    const timer = setInterval(() => {
      revalidate();
    }, THREE_SECONDS);
    return () => clearInterval(timer); //remove when component dismounts
  }, [revalidate]);

  return (
    <>
      <Grid size={{ xs: 12, md: 12, lg: 12 }}>
        <StatusCard power={power} preset={preset} source={source} />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 6 }}>
        <VolumeCard volume={volume} />
      </Grid>
    </>
  );
};
export default AppBody;
