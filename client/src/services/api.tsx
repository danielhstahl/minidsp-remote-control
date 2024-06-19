export enum Power {
    On = "On",
    Off = "Off",
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
    //power: Power; // hmm
    source: Source;
    volume: number;
    preset: Preset;
}

export const getWebSocket = (cb: (currentStatus: HtxWrite) => void) => {
    const socket = new WebSocket(process.env.NODE_ENV === 'production' ? '/ws' : 'ws://localhost:4000/ws')
    socket.addEventListener("message", (event) => {
        const { source, volume, preset } = JSON.parse(event.data)
        cb({ source, volume, preset })
    })
}

interface Body {
    [key: string]: string | number
}
export const postRequest = (body: Body) => {
    const fullUrl = `/api/devices/0/config`
    return fetch(fullUrl, { method: "POST", body: JSON.stringify({ master_status: body }) })
}

/*
export const getWrite = () => fetch("/info").then(res => res.json()).then(r => {
    const { power, source, volume, mode } = r
    const convertedMode = mode !== Mode.stereo ? Mode.auto : Mode.stereo
    return { power, source, volume, mode: convertedMode } as XmcWrite
})*/

