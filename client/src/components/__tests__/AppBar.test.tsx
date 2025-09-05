import { render } from "vitest-browser-react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ThemeProvider } from "@mui/material/styles";
import { DEFAULT_COLOR_THEME, themes } from "../../styles/modes"; // You'll need to import your theme
import AppBarMenu from "../AppBar";
import { createRoutesStub } from "react-router";

describe("AppBarMenu", () => {
  const mockSetMode = vi.fn();
  const theme = themes[DEFAULT_COLOR_THEME];
  const getRouterStub = (mode: "light" | "dark" | "dark_evil") => {
    return createRoutesStub([
      {
        path: "/",
        Component: () => {
          return (
            <ThemeProvider theme={theme}>
              <AppBarMenu setMode={mockSetMode} mode={mode} isAdmin={true} />
            </ThemeProvider>
          );
        },
      },
    ]);
  };
  beforeEach(() => {
    mockSetMode.mockClear();
  });

  it("renders the title correctly", async () => {
    const Stub = getRouterStub("light");
    const screen = render(<Stub />);
    await expect
      .element(screen.getByText("MiniDSP", { exact: true }))
      .toBeInTheDocument();
  });

  it("renders all three theme toggle buttons", async () => {
    const Stub = getRouterStub("light");
    const screen = render(<Stub />);
    await expect
      .element(screen.getByLabelText("Light Mode"))
      .toBeInTheDocument();
    await expect
      .element(screen.getByLabelText("Dark Mode", { exact: true }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByLabelText("Evil Dark Mode"))
      .toBeInTheDocument();
  });

  it("calls setMode with correct value when light mode is selected", async () => {
    const Stub = getRouterStub("dark");
    const screen = render(<Stub />);
    await screen.getByLabelText("Light Mode").click();
    expect(mockSetMode).toHaveBeenCalledWith("light");
  });

  it("calls setMode with correct value when dark mode is selected", async () => {
    const Stub = getRouterStub("light");
    const screen = render(<Stub />);
    await screen.getByLabelText("Dark Mode", { exact: true }).click();
    expect(mockSetMode).toHaveBeenCalledWith("dark");
  });

  it("calls setMode with correct value when evil dark mode is selected", async () => {
    const Stub = getRouterStub("light");
    const screen = render(<Stub />);
    await screen.getByLabelText("Evil Dark Mode").click();
    expect(mockSetMode).toHaveBeenCalledWith("dark_evil");
  });

  it("highlights the current mode button", async () => {
    const Stub = getRouterStub("dark_evil");
    const screen = render(<Stub />);
    await expect
      .element(screen.getByLabelText("Evil Dark Mode"))
      .toHaveAttribute("aria-pressed", "true");
  });
  it("shows settings when logged in", async () => {
    const Stub = createRoutesStub([
      {
        path: "/",
        Component: () => {
          return (
            <ThemeProvider theme={theme}>
              <AppBarMenu setMode={mockSetMode} mode={"light"} isAdmin={true} />
            </ThemeProvider>
          );
        },
      },
    ]);
    const screen = render(<Stub />);
    await expect.element(screen.getByLabelText("settings")).toBeInTheDocument();
  });
  it("shows settings when logged in", async () => {
    const Stub = createRoutesStub([
      {
        path: "/",
        Component: () => {
          return (
            <ThemeProvider theme={theme}>
              <AppBarMenu
                setMode={mockSetMode}
                mode={"light"}
                isAdmin={false}
              />
            </ThemeProvider>
          );
        },
      },
    ]);
    const screen = render(<Stub />);
    await expect.element(screen.getByLabelText("login")).toBeInTheDocument();
  });
});
