import { render } from "vitest-browser-react";
import { describe, expect, it, vi } from "vitest";
import DeviceList from "../DeviceList";
import { createRoutesStub } from "react-router";
describe("DeviceList", () => {
  it("renders", async () => {
    const Stub = createRoutesStub([
      {
        path: "/",
        Component: () => {
          return (
            <DeviceList
              devices={[
                { deviceIp: "127.0.0.1", isAllowed: false },
                { deviceIp: "192.168.0.1", isAllowed: true },
              ]}
            />
          );
        },
      },
    ]);
    const screen = render(<Stub />);
    await expect.element(screen.getByText("Allowed IPs")).toBeInTheDocument();
  });
  it("submits on check", async () => {
    const action = vi.fn();
    const Stub = createRoutesStub([
      {
        path: "/settings",
        action,
        Component: () => {
          return (
            <DeviceList
              devices={[
                { deviceIp: "127.0.0.1", isAllowed: false },
                { deviceIp: "192.168.0.1", isAllowed: true },
              ]}
            />
          );
        },
      },
    ]);
    const screen = render(<Stub initialEntries={["/settings"]} />);
    await screen.getByRole("switch").first().click();
    expect(action.mock.calls).toHaveLength(1);
    await expect
      .element(screen.getByRole("switch").first())
      .toHaveAttribute("checked", "");
  });
});
