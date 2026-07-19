import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupWorker } from "msw/browser";
import { PowerEnum, SourceEnum, PresetEnum } from "../../types";
import { expiryLoader, statusLoader } from "../loaders";

describe("authAndExpiryLoader", () => {
  it("provides expiry on allowed", async () => {
    const date = new Date();
    date.setDate(date.getDate() + 60);
    const server = setupWorker(
      http.get("/api/cert/expiration", () => {
        return HttpResponse.json({ expiry: date });
      }),
    );
    await server.start({ quiet: true });
    const result = await expiryLoader();
    expect(result instanceof Date).toBeTruthy();
    server.stop();
  });
});

describe("statusLoader", () => {
  it("get status", async () => {
    const server = setupWorker(
      http.get("/api/devices/0", () => {
        return HttpResponse.json({
          master: {
            source: SourceEnum.HDMI,
            volume: -40,
            preset: PresetEnum.preset2,
          },
        });
      }),
      http.get("/api/power", () => {
        return HttpResponse.json(PowerEnum.On);
      }),
    );
    await server.start({ quiet: true });
    const result = await statusLoader();
    expect(result).toEqual({
      power: PowerEnum.On,
      source: SourceEnum.HDMI,
      volume: -40,
      preset: PresetEnum.preset2,
    });
    server.stop();
  });
});
