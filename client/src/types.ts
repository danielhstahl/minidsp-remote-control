export const PowerEnum = {
    On: "on",
    Off: "off",
} as const;

export type Power = (typeof PowerEnum)[keyof typeof PowerEnum];

export const SourceEnum = {
    USB: "Usb",
    HDMI: "Hdmi",
    Toslink: "Toslink",
    Spdif: "Spdif",
    Analog: "Analog",
} as const;

export type Source = (typeof SourceEnum)[keyof typeof SourceEnum];

export const PresetEnum = {
    preset1: "0",
    preset2: "1",
    preset3: "2",
    preset4: "3",
} as const;

export type Preset = (typeof PresetEnum)[keyof typeof PresetEnum];

export interface HtxMaster {
    source: Source;
    volume: number;
    preset: Preset;
}

export interface HtxMasterConfig {
    master: HtxMaster;
}

export interface HtxConfig extends HtxMaster {
    power: Power;
}

export interface SSLCertExpiry {
    expiry: Date;
}

export interface Device {
    deviceIp: string;
    isAllowed: boolean;
}

export type LocalHeaders = {
    [key: string]: string;
};
