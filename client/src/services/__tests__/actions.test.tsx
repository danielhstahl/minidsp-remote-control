import { describe, expect, it } from "vitest";
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

describe("volumeAction", async () => {
  it("succeeds when hitting volume/up", async () => {
    const server = setupWorker(
      http.post("/api/devices/0/volume/up", () => {
        return HttpResponse.json({ success: true });
      }),
    );
    await server.start({ quiet: true });
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
    server.stop();
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
    server.stop();
  });
  it("succeeds when hitting volume/vol", async () => {
    const server = setupWorker(
      http.post("/api/devices/0/config", () => {
        return HttpResponse.json({ success: true });
      }),
    );
    await server.start({ quiet: true });
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
    server.stop();
  });
});

describe("presetAction", async () => {
  const server = setupWorker(
    http.post("/api/devices/0/preset/:preset", () => {
      return HttpResponse.json({});
    }),
  );
  await server.start({ quiet: true });
  it("succeeds when hitting preset", async () => {
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
  server.stop();
});

describe("powerAction", async () => {
  const server = setupWorker(
    http.post("/api/power", () => {
      return HttpResponse.json({});
    }),
  );
  await server.start({ quiet: true });
  it("succeeds when hitting power", async () => {
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
  server.stop();
});

describe("sourceAction", async () => {
  const server = setupWorker(
    http.post("/api/devices/0/source/:source", () => {
      return HttpResponse.json({});
    }),
  );
  await server.start({ quiet: true });
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
  server.stop();
});

describe("certAction", async () => {
  it("succeeds when hitting cert", async () => {
    const server = setupWorker(
      http.post("/api/cert", () => {
        return HttpResponse.json({});
      }),
    );
    await server.start({ quiet: true });
    const result = await certAction();
    expect(result).toEqual({});
    server.stop();
  });
  it("fails if not authenticated", async () => {
    const server = setupWorker(
      http.post("/api/cert", () => {
        return HttpResponse.json("bad login", { status: 401 });
      }),
    );
    await server.start({ quiet: true });
    const result = await certAction();
    expect(result).toHaveProperty("error");
    server.stop();
  });
});
