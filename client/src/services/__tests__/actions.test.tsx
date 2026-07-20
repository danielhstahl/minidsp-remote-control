import { describe, expect, it, beforeAll, afterEach, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupWorker } from "msw/browser";
import {
  setVolumeAction,
  setPresetAction,
  setPowerAction,
  setSourceAction,
  certAction,
} from "../actions";
import { createFormDataFromValue } from "../../utils/fetcherUtils";

const server = setupWorker();

beforeAll(() => server.start({ quiet: true }));
afterEach(() => server.resetHandlers());
afterAll(() => server.stop());

describe("volumeAction", async () => {
  it("succeeds when hitting volume/up", async () => {
    server.use(
      http.post("/api/devices/0/volume/up", () => {
        return HttpResponse.json({ success: true });
      }),
    );

    const body = createFormDataFromValue("volume", {
      volume: "up",
      volumeValue: 2,
    });
    const req = new Request("/app/volume", { method: "POST", body });
    const result = await setVolumeAction({
      request: req,
      params: {},
      context: {},
      url: new URL(req.url),
      pattern: "/",
    });
    expect(result).toEqual(2);
  });
  it("succeeds when hitting volume/down", async () => {
    const server = setupWorker(
      http.post("/api/devices/0/volume/down", () => {
        return HttpResponse.json({ success: true });
      }),
    );
    await server.start({ quiet: true });
    const body = createFormDataFromValue("volume", {
      volume: "down",
      volumeValue: 2,
    });
    const req = new Request("/app/volume", { method: "POST", body });
    const result = await setVolumeAction({
      request: req,
      params: {},
      context: {},
      url: new URL(req.url),
      pattern: "/",
    });
    expect(result).toEqual(2);
  });
  it("succeeds when hitting volume/vol", async () => {
    server.use(
      http.post("/api/devices/0/config", () => {
        return HttpResponse.json({ success: true });
      }),
    );
    const body = createFormDataFromValue("volume", { volumeValue: -40 });
    const req = new Request("/app/volume", { method: "POST", body });
    const result = await setVolumeAction({
      request: req,
      params: {},
      context: {},
      url: new URL(req.url),
      pattern: "/",
    });
    expect(result).toEqual(-40);
  });
});

describe("presetAction", async () => {
  it("succeeds when hitting preset", async () => {
    server.use(
      http.post("/api/devices/0/preset/:preset", () => {
        return HttpResponse.json({});
      }),
    );
    const formData = new FormData();
    formData.append("preset", "1");
    const req = new Request("/app/preset", { method: "POST", body: formData });
    const result = await setPresetAction({
      request: req,
      params: {},
      context: {},
      url: new URL(req.url),
      pattern: "/",
    });
    expect(result).toEqual("1");
  });
});

describe("powerAction", async () => {
  it("succeeds when hitting power", async () => {
    server.use(
      http.post("/api/power", () => {
        return HttpResponse.json({});
      }),
    );
    const formData = new FormData();
    formData.append("power", "on");
    const req = new Request("/app/power", { method: "POST", body: formData });
    const result = await setPowerAction({
      request: req,
      params: {},
      context: {},
      url: new URL(req.url),
      pattern: "/",
    });
    expect(result).toEqual("on");
  });
});

describe("sourceAction", async () => {
  server.use(
    http.post("/api/devices/0/source/:source", () => {
      return HttpResponse.json({});
    }),
  );
  it("succeeds when hitting source", async () => {
    const formData = new FormData();
    formData.append("source", "HDMI");
    const req = new Request("/app/source", { method: "POST", body: formData });
    const result = await setSourceAction({
      request: req,
      params: {},
      context: {},
      url: new URL(req.url),
      pattern: "/",
    });
    expect(result).toEqual("HDMI");
  });
});

describe("certAction", async () => {
  it("succeeds when hitting cert", async () => {
    server.use(
      http.post("/api/cert", () => {
        return HttpResponse.json({});
      }),
    );
    const result = await certAction();
    expect(result).toEqual({});
  });
  it("fails if not authenticated", async () => {
    server.use(
      http.post("/api/cert", () => {
        return HttpResponse.json("bad login", { status: 401 });
      }),
    );
    const result = await certAction();
    expect(result).toHaveProperty("error");
  });
});
