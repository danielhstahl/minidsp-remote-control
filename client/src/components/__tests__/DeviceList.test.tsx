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
    const action = vi.fn(() => ({
      isAllowed: true,
    }));
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
    screen.debug();
    await expect
      .element(screen.getByTestId("127.0.0.1"))
      .not.toHaveClass("Mui-checked");
    await screen.getByRole("switch").first().click();
    expect(action.mock.calls).toHaveLength(1);
    screen.debug();
    await expect
      .element(screen.getByTestId("127.0.0.1"))
      .toHaveClass("Mui-checked");
  });
});
