import Button from "@mui/material/Button";
import { styled, type Theme } from "@mui/material/styles";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import FormGroup from "@mui/material/FormGroup";
//import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { Link } from "react-router";
import Divider from "@mui/material/Divider";
import GenerateCerts from "../components/GenerateCerts";
import DownloadCaPem from "../components/DownloadCaPem";
import { useLoaderData } from "react-router";
import { type Device } from "../services/api";
import DeviceList from "../components/DeviceList";
const BootstrapDialog = styled(Dialog)(({ theme }: { theme: Theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

const Settings = () => {
  const devices = useLoaderData<Device[]>();
  const open = true;
  console.log(devices);
  return (
    <>
      <BootstrapDialog
        aria-labelledby="customized-dialog-title"
        open={open}
        fullScreen
      >
        <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
          Settings
        </DialogTitle>
        <IconButton
          aria-label="close"
          component={Link}
          to="/"
          sx={(theme: Theme) => ({
            position: "absolute",
            right: 8,
            top: 8,
            color: theme.palette.grey[500],
          })}
        >
          <CloseIcon />
        </IconButton>

        <DialogContent dividers>
          <FormGroup>
            <DownloadCaPem />
            <br />
            <GenerateCerts />
            <br />
            <Divider />
            <DeviceList devices={devices} />
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button component={Link} to="/">
            Ok
          </Button>
        </DialogActions>
      </BootstrapDialog>
    </>
  );
};
export default Settings;
