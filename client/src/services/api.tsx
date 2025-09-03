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

export interface HtxWrite {
  power: Power;
  source: Source;
  volume: number;
  preset: Preset;
}

export interface SSLCertExpiry {
  expiry: Date;
}

export interface Device {
  deviceIp: string;
  isAllowed: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export const addBasicAuthHeader = (code: string) => {
  return {
    authorization: `Basic ${btoa(`:${code}`)}`,
  };
};
export type LocalHeaders = {
  [key: string]: string;
};

const jsonHeaders = {
  "Content-Type": "application/json",
};
// eslint-disable-next-line react-refresh/only-export-components
export const getStatus: () => Promise<HtxWrite> = () => {
  return fetch("/api/status").then((v) => v.json());
};

// eslint-disable-next-line react-refresh/only-export-components
export const setVolume = (volume: number) => {
  return fetch(`/api/volume/${volume}`, { method: "POST" });
};
// eslint-disable-next-line react-refresh/only-export-components
export const volumeUp = () => {
  return fetch(`/api/volume/up`, { method: "POST" });
};
// eslint-disable-next-line react-refresh/only-export-components
export const volumeDown = () => {
  return fetch(`/api/volume/down`, { method: "POST" });
};
// eslint-disable-next-line react-refresh/only-export-components
export const setPreset = (preset: Preset) => {
  return fetch(`/api/preset/${preset}`, { method: "POST" });
};
// eslint-disable-next-line react-refresh/only-export-components
export const setPower = (powerToTurnTo: Power) => {
  return fetch(`/api/power/${powerToTurnTo}`, { method: "POST" });
};
// eslint-disable-next-line react-refresh/only-export-components
export const setSource = (source: Source) => {
  return fetch(`/api/source/${source}`, { method: "POST" });
};
// eslint-disable-next-line react-refresh/only-export-components
export const loadDevice: () => Promise<Device> = () => {
  return fetch(`/api/device`, {
    method: "POST",
    headers: jsonHeaders,
  }).then((v) => v.json());
};
// eslint-disable-next-line react-refresh/only-export-components
export const updateDevice: (
  localHeaders: LocalHeaders,
  device: Device,
) => Promise<Device> = async (localHeaders: LocalHeaders, device: Device) => {
  const headers = { ...localHeaders, ...jsonHeaders };
  const response = await fetch(`/api/device`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(device),
  });
  const result = await response.json();
  if (response.ok) {
    return result;
  } else {
    throw new Error(result);
  }
};
// eslint-disable-next-line react-refresh/only-export-components
export const getDevices: (
  localHeaders: LocalHeaders,
) => Promise<Device[]> = async (localHeaders: LocalHeaders) => {
  const headers = { ...localHeaders, ...jsonHeaders };
  const response = await fetch(`/api/device`, {
    headers,
  });
  const result = await response.json();
  if (response.ok) {
    return result;
  } else {
    throw new Error(result);
  }
};
// eslint-disable-next-line react-refresh/only-export-components
export const generateCert = async (headers: LocalHeaders) => {
  const response = await fetch(`/api/cert`, { method: "POST", headers });
  const result = await response.json(); //.then((v) => v.json());
  if (response.ok) {
    return result;
  } else {
    throw new Error(result);
  }
};
// eslint-disable-next-line react-refresh/only-export-components
export const getExpiry = () => {
  return fetch(`/api/cert/expiration`)
    .then((v) => v.json())
    .then(({ expiry }) => ({ expiry: new Date(expiry) }));
};
// eslint-disable-next-line react-refresh/only-export-components
export const getCaPem = () => {
  return (
    fetch(`/api/cert`, {
      headers: {
        "Content-Disposition": "attachment; filename=ca.crt",
      },
    })
      .then((response) => {
        if (response.body) {
          const reader = response.body.getReader();
          return new ReadableStream({
            start(controller) {
              return pump();
              function pump(): Promise<void> {
                return reader.read().then(({ done, value }) => {
                  // When no more data needs to be consumed, close the stream
                  if (done) {
                    controller.close();
                    return;
                  }
                  // Enqueue the next data chunk into our target stream
                  controller.enqueue(value);
                  return pump();
                });
              }
            },
          });
        } else {
          throw new Error("No Body");
        }
      })
      .then((stream) => new Response(stream))
      // Create an object URL for the response
      .then((response) => response.blob())
      .then((blob) => URL.createObjectURL(blob))
      .then((objUrl) => {
        const fileLink = document.createElement("a");
        fileLink.href = objUrl;
        // suggest a name for the downloaded file
        fileLink.download = "rootCA.pem";
        // simulate click
        fileLink.click();
      })
  );
};
