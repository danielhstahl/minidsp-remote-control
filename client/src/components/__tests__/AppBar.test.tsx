import { render } from 'vitest-browser-react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ThemeProvider } from "@mui/material/styles";
import { DEFAULT_COLOR_THEME, themes } from "../../styles/modes"; // You'll need to import your theme
import AppBarMenu from "../AppBar";
import { MemoryRouter } from "react-router";

describe("AppBarMenu", () => {
  const mockSetMode = vi.fn();
  const theme = themes[DEFAULT_COLOR_THEME];
  const renderAppBar = (mode: "light" | "dark" | "dark_evil") => {
    return render(
      <MemoryRouter>
        <ThemeProvider theme={theme}>
          <AppBarMenu setMode={mockSetMode} mode={mode} />
        </ThemeProvider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    mockSetMode.mockClear();
  });

  it("renders the title correctly", () => {
    const screen = renderAppBar("light");
    expect(screen.getByText("MiniDSP")).toBeInTheDocument();
  });

  it("renders all three theme toggle buttons", () => {
    const screen = renderAppBar("light");
    expect(screen.getByLabelText("Light Mode")).toBeInTheDocument();
    expect(screen.getByLabelText("Dark Mode", { exact: true })).toBeInTheDocument();
    expect(screen.getByLabelText("Evil Dark Mode")).toBeInTheDocument();
  });

  it("calls setMode with correct value when light mode is selected", async () => {
    const screen = renderAppBar("dark");
    await screen.getByLabelText("Light Mode").click()
    expect(mockSetMode).toHaveBeenCalledWith("light");
  });

  it("calls setMode with correct value when dark mode is selected", async () => {
    const screen = renderAppBar("light");
    await screen.getByLabelText("Dark Mode", { exact: true }).click()
    expect(mockSetMode).toHaveBeenCalledWith("dark");
  });

  it("calls setMode with correct value when evil dark mode is selected", async () => {
    const screen = renderAppBar("light");
    await screen.getByLabelText("Evil Dark Mode").click()
    expect(mockSetMode).toHaveBeenCalledWith("dark_evil");
  });

  it("highlights the current mode button", async () => {
    const screen = renderAppBar("dark_evil");
    await expect.element(screen.getByLabelText("Evil Dark Mode")).toHaveAttribute("aria-pressed", "true")

  });
});
