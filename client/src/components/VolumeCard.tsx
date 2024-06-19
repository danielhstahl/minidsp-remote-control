import Stack from '@mui/material/Stack';
import Slider from '@mui/material/Slider';
import VolumeDown from '@mui/icons-material/VolumeDown';
import VolumeUp from '@mui/icons-material/VolumeUp';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress, {
    CircularProgressProps,
} from '@mui/material/CircularProgress';
interface VolumeInputs {
    onVolumeChange: (v: number) => void,
    //volumeUp: () => void,
    //volumeDown: () => void,
    volume: number,

}

const CircularProgressWithLabel = (
    props: CircularProgressProps & { value: number, rawValue: number },
) => {
    const { rawValue, ...rest } = props
    return (
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
                variant="determinate"
                sx={{
                    color: (theme) => theme.palette.grey[theme.palette.mode === 'light' ? 200 : 800],

                }}
                {...rest}
                value={100}
            />
            <CircularProgress
                sx={{
                    //color: (theme) => (theme.palette.mode === 'light' ? '#1a90ff' : '#308fe8'),
                    position: 'absolute',
                    left: 0,
                }}
                variant="determinate" {...rest} />
            <Box
                sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >

                <Typography
                    variant="h3"
                    component="div"
                    color="text.secondary"
                >{rawValue}</Typography>
            </Box>
        </Box>
    );
}

const MIN_VOLUME = -127
const MAX_VOLUME = 0
const convertTo100 = (volume: number) => 100 * ((volume - MIN_VOLUME) / (MAX_VOLUME - MIN_VOLUME))
const VolumeCard = ({ onVolumeChange, volume }: VolumeInputs) => {
    return <Paper
        sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            height: 240,
        }}
    >
        <Stack spacing={2} direction="row" sx={{ mb: 1 }} alignItems="center">
            <IconButton onClick={() => onVolumeChange(volume - 1)} ><VolumeDown /></IconButton>
            <Slider min={MIN_VOLUME} max={MAX_VOLUME} aria-label="Volume" value={volume} onChange={(_e: Event, n: number | number[]) => {
                const volume = n as number
                onVolumeChange(volume)
            }} />
            <IconButton onClick={() => onVolumeChange(volume + 1)} > <VolumeUp /></IconButton>
        </Stack>
        <div style={{
            fontSize: "100%",
            display: "block",
            width: "100%",
            textAlign: "center",
            alignItems: "center"
        }}>
            <CircularProgressWithLabel size="9rem" rawValue={volume} value={convertTo100(volume)} />
        </div>
    </Paper>
}
export default VolumeCard