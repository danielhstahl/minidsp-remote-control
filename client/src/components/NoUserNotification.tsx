//notify when SSL expiry
import Stack from "@mui/material/Stack";
import TrapFocus from "@mui/material/Unstable_TrapFocus";
import Paper from "@mui/material/Paper";
import Fade from "@mui/material/Fade";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormGroup from "@mui/material/FormGroup";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { useState } from "react";
import { setAuthSettings, addBasicAuthHeader } from "../services/api";
import { SetKeys, useAuthSettingsParams } from "../state/credActions";

//export for testing
export const showNotification = (signature: string, requireAuth: boolean) => {
  return requireAuth && signature === "";
};

const NoUserNotification = ({ signature }: { signature: string }) => {
  const [code, setCode] = useState("");
  const {
    state: { requireAuth },
    dispatch: authDispatch,
  } = useAuthSettingsParams();
  const show = showNotification(signature, requireAuth);

  const resetAuth = () => {
    setAuthSettings(addBasicAuthHeader(code), false).then((result) => {
      authDispatch({
        type: SetKeys.UPDATE,
        value: result,
      });
    });
  };
  return (
    <TrapFocus open disableAutoFocus disableEnforceFocus>
      <Fade appear={false} in={show}>
        <Paper
          role="dialog"
          aria-modal="false"
          aria-label="No User Banner"
          square
          variant="outlined"
          tabIndex={-1}
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            m: 0,
            p: 2,
            borderWidth: 0,
            borderTopWidth: 1,
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            sx={{ justifyContent: "space-between", gap: 2 }}
          >
            <Box
              sx={{
                flexShrink: 1,
                alignSelf: { xs: "flex-start", sm: "center" },
              }}
            >
              <Typography sx={{ fontWeight: "bold" }}>
                No private key locally stored.
              </Typography>
              <Typography variant="body2">
                There are no private keys or users stored locally but
                authentication is required. To unlock, please enter the code on
                the bottom of your device.
              </Typography>
              <FormGroup>
                <TextField
                  id="unlock-code"
                  label="Code to unlock device"
                  variant="standard"
                  value={code}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setCode(event.target.value);
                  }}
                />
                <Button onClick={resetAuth}>Ok</Button>
              </FormGroup>
            </Box>
          </Stack>
        </Paper>
      </Fade>
    </TrapFocus>
  );
};

export default NoUserNotification;
