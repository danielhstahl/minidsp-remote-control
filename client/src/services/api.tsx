/**
 *
 * See https://minidsp-rs.pages.dev/daemon/http for HTTP server api docs
 */
import {
  type Power,
  type Source,
  type Preset,
  type HtxConfig,
  type HtxMasterConfig,
  type Device,
  type LocalHeaders,
} from "../types";

export const addBasicAuthHeader = (code: string) => {
  return {
    authorization: `Basic ${btoa(`:${code}`)}`,
  };
};

const jsonHeaders = {
  "Content-Type": "application/json",
};
export const getStatus: () => Promise<HtxConfig> = async () => {
  const [config, power]: [HtxMasterConfig, Power] = await Promise.all([
    fetch(`/api/devices/0`, {
      headers: jsonHeaders,
    }).then((r) => r.json()),
    fetch(`/api/power`, {
      headers: jsonHeaders,
    }).then((r) => r.json()),
  ]);
  return {
    ...config.master,
    power,
  };
};

export const setVolume = (volume: number) => {
  return fetch(`/api/devices/0/config`, {
    method: "POST",
    body: JSON.stringify({ master_status: { volume } }),
  });
};
export const volumeUp = () => {
  return fetch(`/api/devices/0/volume/up`, { method: "POST" });
};
export const volumeDown = () => {
  return fetch(`/api/devices/0/volume/down`, { method: "POST" });
};
export const setPreset = (preset: Preset) => {
  return fetch(`/api/devices/0/preset/${preset}`, { method: "POST" });
};
export const setPower = (powerToTurnTo: Power) => {
  return fetch(`/api/power/${powerToTurnTo}`, { method: "POST" });
};
/*export const getPower: () => Promise<Power> = async () => {
  const response = await fetch(`/api/power`);
  const result = await response.json();
  if (response.ok) {
    return result;
  } else {
    throw new Error(result);
  }
};*/
export const setSource = (source: Source) => {
  return fetch(`/api/devices/0/source/${source.toLowerCase()}`, {
    method: "POST",
  });
};
export const loadDevice: () => Promise<Device> = async () => {
  const response = await fetch(`/api/device`, {
    method: "POST",
    headers: jsonHeaders,
  });
  const result = await response.json();
  if (response.ok) {
    return result;
  } else {
    throw new Error(result);
  }
};
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
export const generateCert = async (headers: LocalHeaders) => {
  const response = await fetch(`/api/cert`, { method: "POST", headers });
  const result = await response.json();
  if (response.ok) {
    return result;
  } else {
    throw new Error(result);
  }
};
export const getExpiry = async () => {
  const response = await fetch(`/api/cert/expiration`);
  const result = await response.json();
  if (response.ok) {
    return new Date(result.expiry);
  } else {
    return;
  }
};
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
              async function pump(): Promise<void> {
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
