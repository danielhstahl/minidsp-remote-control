import { render } from "vitest-browser-react";
import { describe, expect, it } from "vitest";
import AppBody from "../AppBody";
import { createRoutesStub } from "react-router";
import { PowerEnum, PresetEnum, SourceEnum } from "../../services/api";
describe("AppBody", () => {
  it("renders", async () => {
    const Stub = createRoutesStub([
      {
        path: "/app/:param?",
        loader: ({ params }) => ({
          power: PowerEnum.On,
          source: SourceEnum.HDMI,
          volume: -5.0,
          preset: params.param || PresetEnum.preset1,
        }),
        Component: AppBody,
      },
    ]);
    const screen = render(<Stub initialEntries={["/app/2"]} />);
    await expect.element(screen.getByText("Preset 3")).toBeInTheDocument();
  });
  it("renders Preset 1 after at least 3 seconds", async () => {
    const Stub = createRoutesStub([
      {
        path: "/app/:param?",
        loader: ({ params }) => ({
          power: PowerEnum.On,
          source: SourceEnum.HDMI,
          volume: -5.0,
          preset: params.param || PresetEnum.preset1,
        }),
        Component: AppBody,
      },
    ]);
    //after 3 seconds, redirects to /app
    const screen = render(<Stub initialEntries={["/app/2"]} />);
    await expect.element(screen.getByText("Preset 1")).toBeInTheDocument();
  });
});
