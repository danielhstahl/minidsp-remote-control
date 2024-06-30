export enum Power {
    On = "on",
    Off = "off",
}

export enum Source {
    USB = "Usb",
    HDMI = "Hdmi",
    Toslink = "Toslink",
    Spdif = "Spdif",
    Analog = "Analog",
}

export enum Preset {
    preset1 = 0,
    preset2 = 1,
    preset3 = 2,
    preset4 = 3
}

export interface HtxReadOnly {
    audioBits: string
    audioSamplingRate: string
    audioChannels: string
};

export interface HtxWrite {
    power: Power; // hmm
    source: Source;
    volume: number;
    preset: Preset;
}

export const getWebSocket = (cb: (currentStatus: HtxWrite) => void) => {
    const socket = new WebSocket(process.env.NODE_ENV === 'production' ? '/ws' : `${process.env.REACT_APP_PROXY?.replace("http", "ws")}/ws`)
    socket.addEventListener("message", (event) => {
        console.log(event.data)
        const { source, volume, preset, power } = JSON.parse(event.data)
        cb({ source, volume, preset, power })
    })
}

export const setVolume = (volume: number) => {
    return fetch(`/volume/${volume}`, { method: "POST" })
}

export const setPreset = (preset: number) => {
    return fetch(`/preset/${preset}`, { method: "POST" })
}
export const setPower = (powerToTurnTo: Power) => {
    return fetch(`/power/${powerToTurnTo}`, { method: "POST" })
}

