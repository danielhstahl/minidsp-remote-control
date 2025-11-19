import { render } from "vitest-browser-react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { setupWorker } from "msw/browser";
import {
  PowerEnum,
  SourceEnum,
  PresetEnum,
  type SSLCertExpiry,
} from "./types";
import { createRoutesStub } from "react-router";
import { routes } from "./utils/routes";

const get60DaysFuture = () => {
  const date = new Date();
  // Add 60 days to the current date
  date.setDate(date.getDate() + 60);
  return date;
};
const initialExpiryState: SSLCertExpiry = {
  expiry: get60DaysFuture(),
};

const createRouter = () => {
  return createRoutesStub(routes);
};

describe("access scenarios", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });
  test("it renders MiniDSP Remote when device is registered", async () => {
    //dont actually redirect every 3 seconds
    //vi.useFakeTimers();
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

      //post since can create if not already registered
      http.post("/api/device", () => {
        return HttpResponse.json({ isAllowed: true });
      }),
      http.get("/api/cert/expiration", () => {
        return HttpResponse.json(initialExpiryState);
      }),
    );
    await server.start({ quiet: true });
    const Stub = createRouter();
    const screen = render(<Stub />);
    await expect.element(screen.getByText(/MiniDSP/i)).toBeInTheDocument();
    server.stop();
    //vi.clearAllTimers();
  });
  test("first time registering", async () => {
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
      http.post("/api/device", () => {
        return HttpResponse.json({ isAllowed: false });
      }),
      http.get("/api/cert/expiration", () => {
        return HttpResponse.json(initialExpiryState);
      }),
    );
    await server.start({ quiet: true });
    const Stub = createRouter();
    const screen = render(<Stub />);
    //redirects to login page
    await expect
      .element(screen.getByRole("textbox", { name: "password" }))
      .toBeInTheDocument();
    server.stop();
  });
  test("try to go to settings with credentials", async () => {
    //if don't set anything, devicesLoader will fail and redirect to login
    sessionStorage.setItem("admin_password", "something");
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
      //assumes a proper credential
      http.get("/api/device", () => {
        return HttpResponse.json([
          { isAllowed: false, deviceIp: "127.0.0.1" },
          { isAllowed: true, deviceIp: "192.168.0.1" },
        ]);
      }),
    );
    await server.start({ quiet: true });
    const Stub = createRouter();
    const screen = render(<Stub initialEntries={["/settings"]} />);
    await expect.element(screen.getByText("Settings")).toBeInTheDocument();
    server.stop();
  });
  test("try to go to settings with no credentials", async () => {
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
      //simulate unauthorized
      http.get("/api/device", () => {
        return new HttpResponse("bad cred", { status: 401 });
      }),
    );
    await server.start({ quiet: true });
    const Stub = createRouter();
    const screen = render(<Stub initialEntries={["/settings"]} />);
    //redirects to login page
    await expect
      .element(screen.getByRole("textbox", { name: "password" }))
      .toBeInTheDocument();
    server.stop();
  });
});
