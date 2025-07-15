import { useCallback, useMemo } from "react";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import StatusCard from "./PowerCard";
import VolumeCard from "./VolumeCard";
import { refreshStatus, useInterval } from "../utils/refresh";
import {
    Power,
    setVolume,
    setPreset,
    setPower,
    Preset,
    getStatus,
    Source,
    setSource,
    volumeUp,
    volumeDown,
    HtxWrite,
    addAuthHeaders,
    User,
} from "../services/api";
import {
    MinidspAction,
    useMiniDspParams,
    Action,
} from "../state/minidspActions";
const THREE_SECONDS = 3000
// custom hook for parameter updates
function useParameterUpdates(
    miniDspDispatch: (_: Action) => void,
    miniDspParams: HtxWrite,
    userId: string,
    jwt: string
) {
    return useMemo(
        () => ({
            updatePreset: (preset: Preset) => {
                miniDspDispatch({
                    type: MinidspAction.UPDATE,
                    value: { ...miniDspParams, preset },
                });
                setPreset(addAuthHeaders(userId, jwt), preset);
            },
            updateVolume: (volume: number) => {
                miniDspDispatch({
                    type: MinidspAction.UPDATE,
                    value: { ...miniDspParams, volume },
                });
                setVolume(addAuthHeaders(userId, jwt), volume);
            },
            volumeUp: (volume: number, increment: number) => {
                miniDspDispatch({
                    type: MinidspAction.UPDATE,
                    value: { ...miniDspParams, volume: volume + increment },
                });
                volumeUp(addAuthHeaders(userId, jwt));
            },
            volumeDown: (volume: number, increment: number) => {
                miniDspDispatch({
                    type: MinidspAction.UPDATE,
                    value: { ...miniDspParams, volume: volume - increment },
                });
                volumeDown(addAuthHeaders(userId, jwt));
            },
            updatePower: (power: Power) => {
                miniDspDispatch({
                    type: MinidspAction.UPDATE,
                    value: { ...miniDspParams, power },
                });
                setPower(addAuthHeaders(userId, jwt), power);
            },
            updateSource: (source: Source) => {
                miniDspDispatch({
                    type: MinidspAction.UPDATE,
                    value: { ...miniDspParams, source },
                });
                setSource(addAuthHeaders(userId, jwt), source);
            },
        }),
        [miniDspDispatch, miniDspParams, userId, jwt],
    );
}

interface Params extends User {
    requireAuth: boolean
}
const AppBody = ({ jwt, userId, requireAuth }: Params) => {
    const {
        dispatch: miniDspDispatch,
        state: miniDspParams } = useMiniDspParams();
    const updates = useParameterUpdates(
        miniDspDispatch,
        miniDspParams,
        userId,
        jwt
    );
    const getParams = useCallback(
        () =>
            getStatus(addAuthHeaders(userId, jwt)).then((status) =>
                miniDspDispatch({ type: MinidspAction.UPDATE, value: status }),
            ),
        [miniDspDispatch, userId, jwt],
    );
    useInterval(() => {
        refreshStatus(jwt, requireAuth, getParams)
    }, THREE_SECONDS, true) //execute immediately, and then interval
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 12, lg: 12 }}>
                    <StatusCard
                        onPowerToggle={updates.updatePower}
                        power={miniDspParams.power}
                        preset={miniDspParams.preset}
                        source={miniDspParams.source}
                        onPresetChange={updates.updatePreset}
                        onSourceChange={updates.updateSource}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6, lg: 6 }}>
                    <VolumeCard
                        onVolumeSet={updates.updateVolume}
                        onVolumeUp={updates.volumeUp}
                        onVolumeDown={updates.volumeDown}
                        volume={miniDspParams.volume}
                    />
                </Grid>
            </Grid>
        </Container>
    )
}
export default AppBody