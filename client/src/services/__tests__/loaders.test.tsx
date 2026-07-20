import { describe, expect, it, beforeAll, afterEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupWorker } from "msw/browser";
import { PowerEnum, SourceEnum, PresetEnum } from "../../types";
import { expiryLoader, statusLoader } from "../loaders";

const server = setupWorker();

beforeAll(() => server.start({ quiet: true }));
afterEach(() => server.resetHandlers());
afterAll(() => server.stop());

describe("authAndExpiryLoader", () => {
  it("provides expiry on allowed", async () => {
    const date = new Date();
    date.setDate(date.getDate() + 60);
    server.use(
      http.get("/api/cert/expiration", () => {
        return HttpResponse.json({ expiry: date });
      }),
    );
    const result = await expiryLoader();
    expect(result instanceof Date).toBeTruthy();
  });
});

describe("statusLoader", () => {
  it("get status", async () => {
    server.use(
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
    const result = await statusLoader();
    expect(result).toEqual({
      power: PowerEnum.On,
      source: SourceEnum.HDMI,
      volume: -40,
      preset: PresetEnum.preset2,
    });
  });
});
