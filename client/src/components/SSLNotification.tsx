import Stack from "@mui/material/Stack";
import TrapFocus from "@mui/material/Unstable_TrapFocus";
import Paper from "@mui/material/Paper";
import Fade from "@mui/material/Fade";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
const MS_TO_DAYS = 1000 * 3600 * 24;
//export for testing
// eslint-disable-next-line react-refresh/only-export-components
export const showNotification = (currentDate: Date, expiryDate: Date) => {
  return calculateDays(currentDate, expiryDate) < 30;
};
// eslint-disable-next-line react-refresh/only-export-components
export const calculateDays = (currentDate: Date, expiryDate: Date) => {
  return Math.floor(
    (expiryDate.getTime() - currentDate.getTime()) / MS_TO_DAYS,
  );
};

interface Props {
  currentDate: Date;
  expiryDate: Date;
}
const SSLNotification = ({ currentDate, expiryDate }: Props) => {
  const show = showNotification(currentDate, expiryDate);
  const expiryDays = calculateDays(currentDate, expiryDate);
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
                width: "100%",
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
