import Stack from "@mui/material/Stack";
import Slider from "@mui/material/Slider";
import VolumeDown from "@mui/icons-material/VolumeDown";
import VolumeUp from "@mui/icons-material/VolumeUp";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CircularProgress, {
  CircularProgressProps,
} from "@mui/material/CircularProgress";
import { ColorTheme } from "../styles/modes";
import { MIN_VOLUME, MAX_VOLUME } from "../state/writeActions";
const VOLUME_INCREMENT = 0.5;
interface VolumeInputs {
  onVolumeSet: (v: number) => void;
  onVolumeUp: (v: number, increment: number) => void;
  onVolumeDown: (v: number, increment: number) => void;
  volume: number;
  mode: ColorTheme;
}

const CircularProgressWithLabel = (
  props: CircularProgressProps & {
    value: number;
    rawValue: number;
    mode: ColorTheme;
  },
) => {
  const { rawValue, mode, ...rest } = props;
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

export const convertTo100 = (volume: number) =>
  100 * ((volume - MIN_VOLUME) / (MAX_VOLUME - MIN_VOLUME));
const VolumeCard = ({
  onVolumeSet,
  onVolumeUp,
  onVolumeDown,
  volume,
  mode,
}: VolumeInputs) => {
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
        <IconButton onClick={() => onVolumeDown(volume, VOLUME_INCREMENT)}>
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
            const volume = n as number;
            onVolumeSet(volume);
          }}
        />
        <IconButton onClick={() => onVolumeUp(volume, VOLUME_INCREMENT)}>
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
          rawValue={volume}
          value={convertTo100(volume)}
          mode={mode}
        />
      </div>
    </Paper>
  );
};
export default VolumeCard;
