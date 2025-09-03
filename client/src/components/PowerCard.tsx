import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import {
  type Preset,
  type Power,
  type Source,
  SourceEnum,
  PowerEnum,
  PresetEnum,
} from "../services/api";
import Grid from "@mui/material/Grid";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import { applyThemePrimaryType } from "../styles/modes";
import { useTheme, type Theme } from "@mui/material/styles";
import { useThemeParams } from "../state/themeActions";
import { useFetcher } from "react-router";
import type { ColorTheme } from "../styles/modes";
interface PowerInputs {
  power: Power;
  preset: Preset;
  source: Source;
}
const PRESET = "Preset";
const SOURCE = "Source";

const SelectPreset = ({ preset, theme }: { preset: Preset; theme: Theme }) => {
  const presetChangeFetcher = useFetcher();
  const formData = presetChangeFetcher.formData?.get("preset") as string;

  const displayPreset = formData || preset;
  return (
    <FormControl size="small" fullWidth>
      <InputLabel id="source-select-label">{PRESET}</InputLabel>
      <Select
        sx={{
          "& .MuiSvgIcon-root": {
            color: theme.palette.primary.main, // <------------------ arrow-svg-color
          },
          "&.MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.primary.main, // <------------------ utline-color on hover
          },
          "&.MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
            {
              borderColor: theme.palette.primary.main, // <------------------ outline-color on focus
            },
        }}
        labelId="source-select-label"
        id="source-select"
        value={displayPreset}
        label={PRESET}
        onChange={(e: SelectChangeEvent) => {
          const form = new FormData();
          form.append("preset", e.target.value);
          presetChangeFetcher.submit(form, {
            action: `/app/preset`,
            method: "post",
          });
        }}
      >
        {Object.values(PresetEnum).map((v, i) => (
          <MenuItem key={v} value={v}>
            Preset {i + 1}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

const SelectSource = ({ theme, source }: { theme: Theme; source: Source }) => {
  const sourceChangeFetcher = useFetcher();
  const formData = sourceChangeFetcher.formData?.get("source") as string;
  const displaySource = formData || source;
  return (
    <FormControl size="small" fullWidth>
      <InputLabel id="source-select-label">{SOURCE}</InputLabel>
      <Select
        sx={{
          "& .MuiSvgIcon-root": {
            color: theme.palette.primary.main, // <------------------ arrow-svg-color
          },
          "&.MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.primary.main, // <------------------ utline-color on hover
          },
          "&.MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
            {
              borderColor: theme.palette.primary.main, // <------------------ outline-color on focus
            },
        }}
        labelId="source-select-label"
        id="source-select"
        value={displaySource}
        label={SOURCE}
        onChange={(e: SelectChangeEvent) => {
          const form = new FormData();
          form.append("source", e.target.value);
          sourceChangeFetcher.submit(form, {
            action: `/app/source`,
            method: "post",
          });
        }}
      >
        {Object.entries(SourceEnum).map(([k, v]) => (
          <MenuItem key={v} value={v}>
            {k}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

const PowerToggle = ({
  power,
  selectedTheme,
}: {
  power: Power;
  selectedTheme: ColorTheme;
}) => {
  const powerChangeFetcher = useFetcher();
  const formData = powerChangeFetcher.formData?.get("power");

  const displayPower = formData || power;
  return (
    <FormControlLabel
      control={
        <Switch
          color={applyThemePrimaryType(selectedTheme)}
          checked={displayPower === PowerEnum.On}
          onChange={(_, checked: boolean) => {
            const form = new FormData();
            form.append("power", checked ? PowerEnum.On : PowerEnum.Off);
            powerChangeFetcher.submit(form, {
              action: `/app/power`,
              method: "post",
            });
          }}
        />
      }
      label="Power"
    />
  );
};

const PowerCard = ({ power, preset, source }: PowerInputs) => {
  const theme = useTheme();
  const { state: selectedTheme } = useThemeParams();

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
          <PowerToggle power={power} selectedTheme={selectedTheme} />
        </Grid>

        <Grid size={6}></Grid>
        <Grid size={6}>
          <SelectPreset preset={preset} theme={theme} />
        </Grid>
        <Grid size={6}>
          <SelectSource source={source} theme={theme} />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default PowerCard;
