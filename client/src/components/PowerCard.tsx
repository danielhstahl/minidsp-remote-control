import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import { Preset, Power, Source } from "../services/api";
import Grid from "@mui/material/Grid";
import Select from "@mui/material/Select";
import { ColorTheme, applyThemePrimaryType } from "../styles/modes";
import { useTheme } from "@mui/material/styles";
interface PowerInputs {
  power: Power;
  preset: Preset;
  source: Source;
  onPresetChange: (preset: Preset) => void;
  onSourceChange: (source: Source) => void;
  onPowerToggle: (power: Power) => void;
  mode: ColorTheme;
}
const PRESET = "Preset";
const SOURCE = "Source";

const PowerCard = ({
  power,
  preset,
  source,
  onSourceChange,
  onPresetChange,
  onPowerToggle,
  mode,
}: PowerInputs) => {
  const theme = useTheme();
  return (
    <Paper
      sx={{
        p: 2,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Grid container spacing={2}>
        <Grid
          size={6}
          style={{
            display: "flex",
          }}
        >
          <FormControlLabel
            control={
              <Switch
                color={applyThemePrimaryType(mode)}
                checked={power === Power.On}
                onChange={(_, checked) =>
                  onPowerToggle(checked ? Power.On : Power.Off)
                }
              />
            }
            label="Power"
          />
        </Grid>

        <Grid size={6}></Grid>
        <Grid size={6}>
          <FormControl size="small" fullWidth>
            <InputLabel id="source-select-label">{PRESET}</InputLabel>
            <Select
              sx={{
                "& .MuiSvgIcon-root": {
                  color: theme.palette.primary.main, // <------------------ arrow-svg-color
                },
                "&.MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline":
                  {
                    borderColor: theme.palette.primary.main, // <------------------ utline-color on hover
                  },
                "&.MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                  {
                    borderColor: theme.palette.primary.main, // <------------------ outline-color on focus
                  },
              }}
              labelId="source-select-label"
              id="source-select"
              value={preset}
              label={PRESET}
              onChange={(e) => onPresetChange(e.target.value as Preset)}
            >
              {Object.values(Preset)
                .filter((v) => typeof v === "number")
                .map((v, i) => (
                  <MenuItem key={v} value={v}>
                    Preset {i + 1}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={6}>
          <FormControl size="small" fullWidth>
            <InputLabel id="source-select-label">{SOURCE}</InputLabel>
            <Select
              sx={{
                "& .MuiSvgIcon-root": {
                  color: theme.palette.primary.main, // <------------------ arrow-svg-color
                },
                "&.MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline":
                  {
                    borderColor: theme.palette.primary.main, // <------------------ utline-color on hover
                  },
                "&.MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                  {
                    borderColor: theme.palette.primary.main, // <------------------ outline-color on focus
                  },
              }}
              labelId="source-select-label"
              id="source-select"
              value={source}
              label={SOURCE}
              onChange={(e) => onSourceChange(e.target.value as Source)}
            >
              {Object.entries(Source).map(([k, v]) => (
                <MenuItem key={v} value={v}>
                  {k}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default PowerCard;
