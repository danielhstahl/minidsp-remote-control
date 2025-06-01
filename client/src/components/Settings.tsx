import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { getCaPem, generateCert } from "../services/api";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";
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
}
const Settings = ({ open, setOpen }: SettingInputs) => {
  const handleClose = () => setOpen(false);
  const [isLoading, setIsLoading] = useState(false);
  const handleGenerateCert = () => {
    setIsLoading(true);
    generateCert().finally(() => setIsLoading(false));
  };
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
          <Button color="primary" onClick={getCaPem}>
            Download root cert
          </Button>{" "}
          If using SSL, add your root cert to the trust store.
          <br />
          <Button loading={isLoading} onClick={handleGenerateCert}>
            Re-generate certs
          </Button>{" "}
          {isLoading
            ? "Re-create the SSL certs"
            : "Re-creating certs, this may take some time"}
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
