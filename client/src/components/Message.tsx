import * as React from "react";
import Snackbar from "@mui/material/Snackbar";
import type { SnackbarCloseReason } from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import type { AlertColor } from "@mui/material/Alert";

interface Props {
  open: boolean;
  handleClose: (
    event?: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason,
  ) => void;
  type: AlertColor;
}
export default function Message({ open, handleClose, type }: Props) {
  return (
    <Snackbar open={open} autoHideDuration={3000} onClose={handleClose}>
      <Alert
        severity={type} //"success"
        sx={{ width: "100%" }}
      >
        {type === "success" ? "Success!" : "Error!"}
      </Alert>
    </Snackbar>
  );
}
