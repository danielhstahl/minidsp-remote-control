import Paper from '@mui/material/Paper';
import Grid from '@mui/system/Unstable_Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
interface SourceInputs {
    audioBitstream: string,
    audioInfo: string,
    audioMode: string,
    videoFormat: string
}
const SourceCard = ({ audioBitstream, audioInfo, audioMode, videoFormat }: SourceInputs) => {
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
                <List>

                    <ListItem disableGutters>
                        <ListItemText primary={audioBitstream} secondary="Audio Input" />
                    </ListItem>

                    <ListItem disableGutters>
                        <ListItemText primary={audioMode} secondary="Audio Output" />
                    </ListItem>

                </List>
            </Grid>
            <Grid xs={6} style={{
                display: "flex",
            }}>
                <List>
                    <ListItem disableGutters>
                        <ListItemText primary={audioInfo} secondary="Input format" />
                    </ListItem>
                    <ListItem disableGutters>
                        <ListItemText primary={videoFormat} secondary="Video Output" />
                    </ListItem>
                </List>
            </Grid>
        </Grid>
    </Paper>
}

export default SourceCard