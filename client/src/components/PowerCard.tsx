import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import { Source, Preset } from '../services/api'
import Grid from '@mui/system/Unstable_Grid'
import Select from '@mui/material/Select';


interface PowerInputs {
    //onPowerToggle: () => void,
    power: boolean,
    onSourceChange: (source: Source) => void,
    source: Source,
    preset: Preset,
    onPresetChange: (preset: Preset) => void

}
const SOURCE = "Source"
const PRESET = "Preset"

const PowerCard = ({ power, onSourceChange, source, preset, onPresetChange }: PowerInputs) => {
    console.log(preset)
    return <Paper
        sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
        }}
    >
        <Grid container spacing={2}>
            <Grid xs={6} style={{
                display: "flex",
            }}>
                <FormControlLabel
                    control={<Switch checked={power} onChange={() => { }} />}
                    label="Power"
                />
            </Grid>
            <Grid xs={6}>
                <FormControl size="small" fullWidth >
                    <InputLabel id="source-select-label">{SOURCE}</InputLabel>
                    <Select
                        labelId="source-select-label"
                        id="source-select"
                        value={source}
                        label={SOURCE}
                        onChange={e => onSourceChange(e.target.value as Source)}
                    >
                        {Object.values(Source).map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                    </Select>
                </FormControl>
            </Grid>
            <Grid xs={6}></Grid>
            <Grid xs={6}>
                <FormControl size="small" fullWidth >
                    <InputLabel id="source-select-label">{PRESET}</InputLabel>
                    <Select
                        labelId="source-select-label"
                        id="source-select"
                        value={preset}
                        label={PRESET}
                        onChange={e => onPresetChange(e.target.value as Preset)}
                    >
                        {Object.values(Preset).filter(v => typeof v === 'number').map((v, i) => <MenuItem key={v} value={v}>Preset {i + 1}</MenuItem>)}
                    </Select>
                </FormControl>
            </Grid>
        </Grid>
    </Paper >
}

export default PowerCard