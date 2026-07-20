import { render } from "vitest-browser-react";
import {
  beforeEach,
  describe,
  expect,
  test,
  vi,
  beforeAll,
  afterEach,
  afterAll,
} from "vitest";
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

const server = setupWorker();

beforeAll(() => server.start({ quiet: true }));
afterEach(() => server.resetHandlers());
afterAll(() => server.stop());

describe("access scenarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  test("it renders MiniDSP Remote", async () => {
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
      http.get("/api/cert/expiration", () => {
        return HttpResponse.json(initialExpiryState);
      }),
    );
    const Stub = createRouter();
    const screen = render(<Stub />);
    await expect.element(screen.getByText(/MiniDSP/i)).toBeInTheDocument();
  });

  test("try to go to settings with credentials", async () => {
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
      //assumes a proper credential
      http.get("/api/device", () => {
        return HttpResponse.json([
          { isAllowed: false, deviceIp: "127.0.0.1" },
          { isAllowed: true, deviceIp: "192.168.0.1" },
        ]);
      }),
    );
    const Stub = createRouter();
    const screen = render(<Stub initialEntries={["/settings"]} />);
    await expect.element(screen.getByText("Settings")).toBeInTheDocument();
  });
  test("try to go to settings", async () => {
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
    const Stub = createRouter();
    const screen = render(<Stub initialEntries={["/settings"]} />);
    //redirects to login page
    await expect
      .element(screen.getByRole("button", { name: "Generate certs" }))
      .toBeInTheDocument();
  });
});
