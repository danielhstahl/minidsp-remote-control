import Stack from "@mui/material/Stack";
import Slider from "@mui/material/Slider";
import VolumeDown from "@mui/icons-material/VolumeDown";
import VolumeUp from "@mui/icons-material/VolumeUp";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import type { CircularProgressProps } from "@mui/material/CircularProgress";

const VOLUME_INCREMENT = 0.5;
import { useFetcher } from "react-router";
interface VolumeInputs {
  volume: number;
}

const MIN_VOLUME = -127;
const MAX_VOLUME = 0;

const CircularProgressWithLabel = (
  props: CircularProgressProps & {
    value: number;
    rawValue: number;
  },
) => {
  const { rawValue, ...rest } = props;
  return (
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      <CircularProgress
        variant="determinate"
        sx={{
          color: (theme) => theme.palette.secondary.main,
        }}
        {...rest}
        value={100}
      />
      <CircularProgress
        sx={{
          color: (theme) => theme.palette.primary.main,
          position: "absolute",
          left: 0,
        }}
        variant="determinate"
        {...rest}
      />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: "absolute",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="h3" component="div" color="text.secondary">
          {rawValue}
        </Typography>
      </Box>
    </Box>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const convertTo100 = (volume: number) =>
  100 * ((volume - MIN_VOLUME) / (MAX_VOLUME - MIN_VOLUME));
const VolumeCard = ({ volume }: VolumeInputs) => {
  const volumeChangeFetcher = useFetcher();
  const { volumeValue } = volumeChangeFetcher.formData
    ? JSON.parse(volumeChangeFetcher.formData.get("volume") as string)
    : { volumeValue: null };
  const displayVolume = volumeValue || volume;
  return (
    <Paper
      sx={{
        p: 2,
        display: "flex",
        flexDirection: "column",
        height: 240,
      }}
    >
      <Stack spacing={2} direction="row" sx={{ mb: 1 }} alignItems="center">
        <IconButton
          onClick={() => {
            const form = new FormData();
            form.append(
              "volume",
              JSON.stringify({
                volume: "down",
                volumeValue: displayVolume - VOLUME_INCREMENT,
              }),
            );
            volumeChangeFetcher.submit(form, {
              action: `/app/volume`,
              method: "post",
            });
          }}
        >
          <VolumeDown />
        </IconButton>
        <Slider
          sx={{
            color: (theme) => theme.palette.primary.main,
          }}
          min={MIN_VOLUME}
          max={MAX_VOLUME}
          aria-label="Volume"
          value={volume}
          onChange={(_e: Event, n: number | number[]) => {
            const form = new FormData();
            form.append(
              "volume",
              JSON.stringify({
                volumeValue: n,
              }),
            );
            volumeChangeFetcher.submit(form, {
              action: `/app/volume`,
              method: "post",
            });
          }}
        />
        <IconButton
          onClick={() => {
            const form = new FormData();
            form.append(
              "volume",
              JSON.stringify({
                volume: "up",
                volumeValue: displayVolume + VOLUME_INCREMENT,
              }),
            );
            volumeChangeFetcher.submit(form, {
              action: `/app/volume`,
              method: "post",
            });
          }}
        >
          {" "}
          <VolumeUp />
        </IconButton>
      </Stack>
      <div
        style={{
          fontSize: "100%",
          display: "block",
          width: "100%",
          textAlign: "center",
          alignItems: "center",
        }}
      >
        <CircularProgressWithLabel
          size="9rem"
          rawValue={displayVolume}
          value={convertTo100(displayVolume)}
        />
      </div>
    </Paper>
  );
};
export default VolumeCard;
