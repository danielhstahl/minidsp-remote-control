import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupWorker } from "msw/browser";
import { PowerEnum, SourceEnum, PresetEnum } from "../../services/api";
import { authAndExpiryLoader, statusLoader, devicesLoader } from "../loaders";

describe("authAndExpiryLoader", () => {
  it("provides expiry on allowed", async () => {
    const date = new Date();
    date.setDate(date.getDate() + 60);
    const server = setupWorker(
      http.post("/api/device", () => {
        return HttpResponse.json({ isAllowed: true });
      }),
      http.get("/api/cert/expiration", () => {
        return HttpResponse.json({ expiry: date });
      }),
    );
    await server.start({ quiet: true });
    const result = await authAndExpiryLoader();
    expect(result instanceof Date).toBeTruthy();
    server.stop();
  });
  it("redirects to login on not allowed", async () => {
    const date = new Date();
    date.setDate(date.getDate() + 60);
    const server = setupWorker(
      http.post("/api/device", () => {
        return HttpResponse.json({ isAllowed: false });
      }),
      http.get("/api/cert/expiration", () => {
        return HttpResponse.json({ expiry: date });
      }),
    );
    await server.start({ quiet: true });
    const result = await authAndExpiryLoader();
    expect(result instanceof Response).toBeTruthy();
    if (result instanceof Response) {
      expect(result.headers.get("Location")).toEqual("/login");
    }
    server.stop();
  });
});

describe("statusLoader", () => {
  it("get status", async () => {
    const server = setupWorker(
      http.get("/api/status", () => {
        return HttpResponse.json({
          power: PowerEnum.On,
          source: SourceEnum.HDMI,
          volume: -40,
          preset: PresetEnum.preset2,
        });
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

describe("devicesLoader", () => {
  it("get devices on auth", async () => {
    sessionStorage.setItem("admin_password", "helloworld");
    const server = setupWorker(
      http.get("/api/device", () => {
        return HttpResponse.json([
          { isAllowed: false, deviceIp: "127.0.0.1" },
          { isAllowed: true, deviceIp: "192.168.0.1" },
        ]);
      }),
    );
    await server.start({ quiet: true });
    const result = await devicesLoader();
    expect(result).toEqual([
      { isAllowed: false, deviceIp: "127.0.0.1" },
      { isAllowed: true, deviceIp: "192.168.0.1" },
    ]);
    server.stop();
    sessionStorage.clear();
  });
  it("redirects on failure", async () => {
    const server = setupWorker(
      http.get("/api/device", () => {
        return HttpResponse.json("bad auth", { status: 401 });
      }),
    );
    await server.start({ quiet: true });
    const result = await devicesLoader();
    expect(result instanceof Response).toBeTruthy();
    if (result instanceof Response) {
      expect(result.headers.get("Location")).toEqual("/login");
    }
    server.stop();
  });
});
