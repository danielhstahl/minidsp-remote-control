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
  certInfo?: SSLCert;
}
export interface UserId {
  userId: string;
}
export interface User extends UserId {
  jwt: string;
}

export const addAuthHeaders = (userId: string, jwt: string) => {
  return {
    "x-user-id": userId,
    authorization: `Bearer ${jwt}`,
  };
};
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
export const getStatus: (headers: LocalHeaders) => Promise<HtxWrite> = (
  headers: LocalHeaders,
) => {
  return fetch("/api/status", { headers }).then((v) => v.json());
};

export const setVolume = (headers: LocalHeaders, volume: number) => {
  return fetch(`/api/volume/${volume}`, { method: "POST", headers });
};

export const volumeUp = (headers: LocalHeaders) => {
  return fetch(`/api/volume/up`, { method: "POST", headers });
};

export const volumeDown = (headers: LocalHeaders) => {
  return fetch(`/api/volume/down`, { method: "POST", headers });
};

export const setPreset = (headers: LocalHeaders, preset: number) => {
  return fetch(`/api/preset/${preset}`, { method: "POST", headers });
};
export const setPower = (headers: LocalHeaders, powerToTurnTo: Power) => {
  return fetch(`/api/power/${powerToTurnTo}`, { method: "POST", headers });
};
export const setSource = (headers: LocalHeaders, source: Source) => {
  return fetch(`/api/source/${source}`, { method: "POST", headers });
};

export const getAuthSettings: (
  headers: LocalHeaders,
) => Promise<AuthSettings> = (headers: LocalHeaders) => {
  return fetch(`/api/auth_settings`, { headers })
    .then((v) => v.json())
    .then((fullResult) => {
      const { requireAuth, key, ...rest } = fullResult;
      return {
        requireAuth,
        key,
        certInfo: {
          ...rest,
          validFromDate: new Date(rest.validFromDate),
          validToDate: new Date(rest.validToDate),
        },
      };
    });
};

export const setAuthSettings: (
  headers: LocalHeaders,
  requireAuth: boolean,
) => Promise<AuthSettings> = (
  localHeaders: LocalHeaders,
  requireAuth: boolean,
) => {
    const headers = { ...localHeaders, ...jsonHeaders };
    return fetch(`/api/auth_settings`, {
      method: "POST",
      headers,
      body: JSON.stringify({ requireAuth }),
    }).then((v) => v.json());
  };

export const createUser: (
  headers: LocalHeaders,
  publicKey: string,
) => Promise<UserId> = (localHeaders: LocalHeaders, publicKey: string) => {
  const headers = { ...localHeaders, ...jsonHeaders };
  return fetch(`/api/user`, {
    method: "POST",
    headers,
    body: JSON.stringify({ publicKey }),
  }).then((v) => v.json());
};

export const updateUser: (
  localHeaders: LocalHeaders,
  publicKey: string,
  userId: string,
) => Promise<UserId> = (
  localHeaders: LocalHeaders,
  publicKey: string,
  userId: string,
) => {
    const headers = { ...localHeaders, ...jsonHeaders };
    return fetch(`/api/user/${userId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ publicKey }),
    }).then((v) => v.json());
  };

export const generateCert = (headers: LocalHeaders) => {
  return fetch(`/api/regenerate_cert`, { method: "POST", headers });
};
export const getCaPem = (headers: LocalHeaders) => {
  return (
    fetch(`/api/root_pem`, {
      headers: {
        "Content-Disposition": "attachment; filename=ca.crt",
        ...headers,
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
