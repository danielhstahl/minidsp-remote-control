import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import {
  getCaPem,
  generateCert,
  setAuthSettings,
  createUser,
} from "../services/api";
import IconButton from "@mui/material/IconButton";
import DownloadForOfflineIcon from "@mui/icons-material/DownloadForOffline";
import CachedIcon from "@mui/icons-material/Cached";
import CloseIcon from "@mui/icons-material/Close";
import Switch from "@mui/material/Switch";
import { ColorTheme, applyThemePrimaryType } from "../styles/modes";
import { useState } from "react";
import { SetKeys, useAuthSettingsParams } from "../state/credActions";
import { generateKeyPair } from "../services/keyCreation";
import { savePrivateKey } from "../state/persistance";
const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));
interface SettingInputs {
  open: boolean;
  setOpen: (isOpen: boolean) => void;
  mode: ColorTheme;
}
const Settings = ({ open, setOpen, mode }: SettingInputs) => {
  const handleClose = () => setOpen(false);
  const [isLoading, setIsLoading] = useState(false);
  const handleGenerateCert = () => {
    setIsLoading(true);
    generateCert().finally(() => setIsLoading(false));
  };

  const { dispatch: authDispatch, state: authParams } = useAuthSettingsParams();
  return (
    <>
      <BootstrapDialog
        onClose={handleClose}
        aria-labelledby="customized-dialog-title"
        open={open}
      >
        <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
          Settings
        </DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleClose}
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
            <Button
              variant="contained"
              onClick={getCaPem}
              startIcon={<DownloadForOfflineIcon />}
            >
              Download root cert
            </Button>
            <br />
            <Button
              loading={isLoading}
              variant="contained"
              onClick={handleGenerateCert}
              startIcon={<CachedIcon />}
            >
              Re-generate certs
            </Button>
            <br />
            <Button
              variant="contained"
              onClick={() => {
                generateKeyPair().then(({ publicKey, privateKey }) => {
                  savePrivateKey(privateKey); //local storage
                  //what to do about new users? or do I just override?
                  createUser(publicKey).then(() => {
                    //set user state
                  });
                });
              }}
              startIcon={<CachedIcon />}
            >
              Re-generate certs
            </Button>
            <br />
            <FormControlLabel
              control={
                <Switch
                  disabled //todo, make it enabled when private key is generated
                  color={applyThemePrimaryType(mode)}
                  checked={authParams.requireAuth}
                  onChange={(e) => {
                    const switchValue = e.target.checked;
                    setAuthSettings(switchValue).then((result) => {
                      authDispatch({
                        type: SetKeys.UPDATE,
                        value: result,
                      });
                    });
                    authDispatch({
                      type: SetKeys.UPDATE,
                      value: { ...authParams, requireAuth: switchValue },
                    });
                  }}
                />
              }
              label="Require Authentication"
            />
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={handleClose}>
            Ok
          </Button>
        </DialogActions>
      </BootstrapDialog>
    </>
  );
};
export default Settings;
