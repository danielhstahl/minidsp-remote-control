import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { Link } from "react-router";
import Divider from "@mui/material/Divider";
import GenerateCerts from "./GenerateCerts";
import GenerateKeyPair from "./GenerateKeyPair";
import AuthSwitch from "./AuthSwitch";
import DownloadCaPem from "./DownloadCaPem";
const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

const Settings = () => {
  const open = true
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
          sx={(theme) => ({
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
            <GenerateKeyPair />
            <br />
            <FormControlLabel
              control={<AuthSwitch />}
              label="Require Authentication"
            />
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
