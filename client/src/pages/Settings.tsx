import FormGroup from "@mui/material/FormGroup";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import GenerateCerts from "../components/GenerateCerts";
import DownloadCaPem from "../components/DownloadCaPem";
import { useLoaderData } from "react-router";
import { type Device } from "../types";
import DeviceList from "../components/DeviceList";
import Typography from "@mui/material/Typography";
const Settings = () => {
  const devices = useLoaderData<Device[]>();
  return (
    <Grid size={{ xs: 12 }}>
      <Typography variant="h6" style={{ paddingBottom: 20 }}>
        Settings
      </Typography>
      <FormGroup>
        <DownloadCaPem />
        <br />
        <GenerateCerts />
        <br />
        <Divider />
        <DeviceList devices={devices} />
      </FormGroup>
    </Grid>
  );
};
export default Settings;
