import * as React from "react";
import Snackbar, { SnackbarCloseReason } from "@mui/material/Snackbar";
import Alert, { AlertColor } from "@mui/material/Alert";

interface Props {
  open: boolean;
  handleClose: (
    event?: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason
  ) => void;
  type: AlertColor;
}
export default function Message({ open, handleClose, type }: Props) {
  return (
    <Snackbar open={open} autoHideDuration={3000} onClose={handleClose}>
      <Alert
        severity={type} //"success"
        variant="filled"
        sx={{ width: "100%" }}
      >
        {type === "success" ? "Success!" : "Error!"}
      </Alert>
    </Snackbar>
  );
}
