import { render } from "vitest-browser-react";
import { describe, expect, it, vi } from "vitest";
import AppBody from "../AppBody";
import { createRoutesStub } from "react-router";
import { PowerEnum, PresetEnum, SourceEnum } from "../../types";
describe("AppBody", () => {
  it("renders", async () => {
    vi.useFakeTimers();
    const Stub = createRoutesStub([
      {
        path: "/",
        loader: () => ({
          power: PowerEnum.On,
          source: SourceEnum.HDMI,
          volume: -5.0,
          preset: PresetEnum.preset1,
        }),
        Component: AppBody,
      },
    ]);
    const screen = render(<Stub initialEntries={["/"]} />);
    await expect.element(screen.getByText("Preset 1")).toBeInTheDocument();
    vi.clearAllTimers();
  });
  it("renders Preset 1 after at least 3 seconds", async () => {
    vi.useFakeTimers();
    let i = 0;
    const Stub = createRoutesStub([
      {
        path: "/",
        loader: () => {
          i++;
          console.log("got here!!");
          console.log(i);
          return {
            power: PowerEnum.On,
            source: SourceEnum.HDMI,
            volume: -5.0,
            preset: i === 1 ? PresetEnum.preset3 : PresetEnum.preset1,
          };
        },
        Component: AppBody,
      },
    ]);
    //after 3 seconds, redirects to /app
    const screen = render(<Stub initialEntries={["/"]} />);
    //immediate
    await expect.element(screen.getByText("Preset 3")).toBeInTheDocument();
    //after 3 seconds
    vi.advanceTimersByTime(3000);
    await expect.element(screen.getByText("Preset 1")).toBeInTheDocument();
    vi.clearAllTimers();
  });
});
