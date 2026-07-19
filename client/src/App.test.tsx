import { render } from "vitest-browser-react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { setupWorker } from "msw/browser";
import { PowerEnum, SourceEnum, PresetEnum, type SSLCertExpiry } from "./types";
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
    vi.clearAllMocks();
  });
  test("it renders MiniDSP Remote", async () => {
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
      http.get("/api/cert/expiration", () => {
        return HttpResponse.json(initialExpiryState);
      }),
    );
    await server.start({ quiet: true });
    const Stub = createRouter();
    const screen = render(<Stub />);
    await expect.element(screen.getByText(/MiniDSP/i)).toBeInTheDocument();
    server.stop();
  });

  test("try to go to settings with credentials", async () => {
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
  test("try to go to settings", async () => {
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
    const Stub = createRouter();
    const screen = render(<Stub initialEntries={["/settings"]} />);
    //redirects to login page
    await expect
      .element(screen.getByRole("button", { name: "Generate certs" }))
      .toBeInTheDocument();
    server.stop();
  });
});
