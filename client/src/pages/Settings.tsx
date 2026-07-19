import FormGroup from "@mui/material/FormGroup";
import Grid from "@mui/material/Grid";
import GenerateCerts from "../components/GenerateCerts";
import DownloadCaPem from "../components/DownloadCaPem";
import Typography from "@mui/material/Typography";
const Settings = () => {
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
      </FormGroup>
    </Grid>
  );
};
export default Settings;
