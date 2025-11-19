import { describe, expect, it, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupWorker } from "msw/browser";
import {
  setVolumeAction,
  setPresetAction,
  setPowerAction,
  setSourceAction,
  loginAction,
  deviceAction,
  certAction,
} from "../actions";
import { createFormDataFromValue } from "../../utils/fetcherUtils";
import { PresetEnum } from "../../types";

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
    const result = await setVolumeAction({
      request: new Request("/app/volume", { method: "POST", body }),
      params: {},
      context: {},
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
    const result = await setVolumeAction({
      request: new Request("/app/volume", { method: "POST", body }),
      params: {},
      context: {},
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
    const result = await setVolumeAction({
      request: new Request("/app/volume", { method: "POST", body }),
      params: {},
      context: {},
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
    formData.append("preset", PresetEnum.preset2);
    const result = await setPresetAction({
      request: new Request("/app/preset", { method: "POST", body: formData }),
      params: {},
      context: {},
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
    const result = await setPowerAction({
      request: new Request("/app/power", { method: "POST", body: formData }),
      params: {},
      context: {},
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
    const result = await setSourceAction({
      request: new Request("/app/source", { method: "POST", body: formData }),
      params: {},
      context: {},
    });
    expect(result).toEqual("HDMI");
  });
  server.stop();
});

describe("loginAction", async () => {
  afterEach(() => {
    sessionStorage.clear();
  });
  it("succeeds when logging in", async () => {
    const formData = new FormData();
    formData.append("password", "helloworld");
    const result = await loginAction({
      request: new Request("/app/source", { method: "POST", body: formData }),
      params: {},
      context: {},
    });
    expect(result instanceof Response).toBeTruthy();
    if (result instanceof Response) {
      expect(result.headers.get("Location")).toEqual("/settings");
    }
  });
});

describe("deviceAction", async () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("succeeds when setting device", async () => {
    const server = setupWorker(
      http.patch("/api/device", () => {
        return HttpResponse.json({ isAllowed: false, deviceIp: "127.0.0.1" });
      }),
    );
    await server.start({ quiet: true });
    sessionStorage.setItem("admin_password", "helloworld");
    const formData = createFormDataFromValue("device", {
      isAllowed: false,
      deviceIp: "127.0.0.1",
    });
    const result = await deviceAction({
      request: new Request("/app/device", { method: "POST", body: formData }),
      params: {},
      context: {},
    });
    expect(result).toEqual({ isAllowed: false, deviceIp: "127.0.0.1" });
    server.stop();
  });
  it("fails when no password at route", async () => {
    const server = setupWorker(
      http.patch("/api/device", () => {
        return HttpResponse.json("bad login", { status: 401 });
      }),
    );
    await server.start({ quiet: true });
    const formData = createFormDataFromValue("device", {
      isAllowed: false,
      deviceIp: "127.0.0.1",
    });
    const result = await deviceAction({
      request: new Request("/app/device", { method: "POST", body: formData }),
      params: {},
      context: {},
    });
    expect(result).toHaveProperty("error");
    server.stop();
  });
});

describe("certAction", async () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("succeeds when hitting cert", async () => {
    const server = setupWorker(
      http.post("/api/cert", () => {
        return HttpResponse.json({});
      }),
    );
    await server.start({ quiet: true });
    sessionStorage.setItem("admin_password", "helloworld");

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
