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
    power: Power;
    source: Source;
    volume: number;
    preset: Preset;
}


export const getStatus: () => Promise<HtxWrite> = () => {
    return fetch('/status').then(v => v.json())
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
export const setSource = (source: Source) => {
    return fetch(`/source/${source}`, { method: "POST" })
}

