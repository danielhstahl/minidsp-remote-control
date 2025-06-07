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
  preset4 = 3,
}

export interface HtxReadOnly {
  audioBits: string;
  audioSamplingRate: string;
  audioChannels: string;
}

export interface HtxWrite {
  power: Power;
  source: Source;
  volume: number;
  preset: Preset;
}

export interface SSLCert {
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  validFromDate: Date;
  validToDate: Date;
}

export interface AuthSettings {
  key: number;
  requireAuth: boolean;
  stringToSign: string;
}
export interface UserId {
  userId: number;
}
export interface User extends UserId {
  privateKey: string;
}
export const getStatus: () => Promise<HtxWrite> = () => {
  return fetch("/api/status").then((v) => v.json());
};

export const setVolume = (volume: number) => {
  return fetch(`/api/volume/${volume}`, { method: "POST" });
};

export const volumeUp = () => {
  return fetch(`/api/volume/up`, { method: "POST" });
};

export const volumeDown = () => {
  return fetch(`/api/volume/down`, { method: "POST" });
};

export const setPreset = (preset: number) => {
  return fetch(`/api/preset/${preset}`, { method: "POST" });
};
export const setPower = (powerToTurnTo: Power) => {
  return fetch(`/api/power/${powerToTurnTo}`, { method: "POST" });
};
export const setSource = (source: Source) => {
  return fetch(`/api/source/${source}`, { method: "POST" });
};

export const getAuthSettings: () => Promise<AuthSettings> = () => {
  return fetch(`/api/auth_settings`).then((v) => v.json());
};

export const setAuthSettings: (
  requireAuth: boolean,
) => Promise<AuthSettings> = (requireAuth: boolean) => {
  return fetch(`/api/auth_settings`, {
    method: "POST",
    body: JSON.stringify({ requireAuth }),
  }).then((v) => v.json());
};

export const createUser: (publicKey: string) => Promise<UserId> = (
  publicKey: string,
) => {
  return fetch(`/api/user`, {
    method: "POST",
    body: JSON.stringify({ publicKey }),
  }).then((v) => v.json());
};

export const generateCert = () => {
  return fetch(`/api/regenerate_cert`, { method: "POST" });
};
export const getCertInfo: () => Promise<SSLCert> = () => {
  return fetch(`/api/cert_info`)
    .then((v) => v.json())
    .then((result) => {
      return {
        ...result,
        validFromDate: new Date(result.validFromDate),
        validToDate: new Date(result.validToDate),
      };
    });
};
export const getCaPem = () => {
  return (
    fetch(`/api/root_pem`, {
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
