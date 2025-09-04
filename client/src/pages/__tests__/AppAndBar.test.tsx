import { render } from "vitest-browser-react";
import { describe, expect, it, vi } from "vitest";
import AppAndBar from "../AppAndBar";
import { createRoutesStub } from "react-router";
import { DEFAULT_COLOR_THEME } from "../../styles/modes";
import { Outlet } from "react-router";
describe("AppAndBar", () => {
  it("renders", async () => {
    const setSelectedTheme = vi.fn();
    const Stub = createRoutesStub([
      {
        path: "/",
        loader: () => new Date(),
        Component: () => {
          return (
            <Outlet
              context={{
                setThemeAndSave: setSelectedTheme,
                selectedTheme: { DEFAULT_COLOR_THEME },
              }}
            />
          );
        },
        children: [
          {
            path: "/",
            loader: () => new Date(),
            Component: AppAndBar,
            children: [
              {
                path: "/",
                Component: () => <p>hello world</p>,
              },
            ],
          },
        ],
      },
    ]);
    const screen = render(<Stub />);
    await expect.element(screen.getByText("hello world")).toBeInTheDocument();
  });
  it("SSL notifies", async () => {
    const setSelectedTheme = vi.fn();
    const Stub = createRoutesStub([
      {
        path: "/",

        Component: () => {
          return (
            <Outlet
              context={{
                setThemeAndSave: setSelectedTheme,
                selectedTheme: { DEFAULT_COLOR_THEME },
              }}
            />
          );
        },
        children: [
          {
            path: "/",
            loader: () => new Date(),
            Component: AppAndBar,
            children: [
              {
                path: "/",
                Component: () => <p>hello world</p>,
              },
            ],
          },
        ],
      },
    ]);
    const screen = render(<Stub />);
    await expect
      .element(screen.getByText("SSL Certificate has expired!"))
      .toBeInTheDocument();
  });
});
