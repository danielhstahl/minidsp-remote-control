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

export const getCaCert = () => {
  return (
    fetch(`/api/cacrt`, {
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
        fileLink.download = "ca.crt";
        // simulate click
        fileLink.click();
      })
  );
};
