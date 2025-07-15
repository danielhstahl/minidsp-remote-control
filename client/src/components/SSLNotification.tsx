//notify when SSL expiry
import { useEffect } from "react";
import Stack from "@mui/material/Stack";
import TrapFocus from "@mui/material/Unstable_TrapFocus";
import Paper from "@mui/material/Paper";
import Fade from "@mui/material/Fade";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  getExpiry,
} from "../services/api";
import { SetExpiry, useExpiryParams } from "../state/expiryActions";
const MS_TO_DAYS = 1000 * 3600 * 24;
//export for testing
export const showNotification = (currentDate: Date, expiryDate: Date) => {
  return calculateDays(currentDate, expiryDate) < 30;
};

export const calculateDays = (currentDate: Date, expiryDate: Date) => {
  return Math.floor(
    (expiryDate.getTime() - currentDate.getTime()) / MS_TO_DAYS
  );
};

const SSLNotification = ({
  currentDate,
}: {
  currentDate: Date;
}) => {

  const {
    dispatch: expiryDispatch,
    state: { expiry } } = useExpiryParams();
  useEffect(() => {
    //no auth on this endpoint
    getExpiry({}).then((expiry) =>
      expiryDispatch({ type: SetExpiry.UPDATE, value: expiry }),
    )
  }, [expiryDispatch]);
  const show = showNotification(currentDate, expiry);
  const expiryDays = calculateDays(currentDate, expiry);
  return (
    <TrapFocus open disableAutoFocus disableEnforceFocus>
      <Fade appear={false} in={show}>
        <Paper
          role="dialog"
          aria-modal="false"
          aria-label="SSL Banner"
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
                {expiryDays > 0
                  ? `SSL Certificate will expire in ${expiryDays} days`
                  : `SSL Certificate has expired!`}
              </Typography>
              <Typography variant="body2">
                Please go to settings to regenerate your certificate. You will
                also need to download the CA Pem and update your trust stores.
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Fade>
    </TrapFocus>
  );
};

export default SSLNotification;
