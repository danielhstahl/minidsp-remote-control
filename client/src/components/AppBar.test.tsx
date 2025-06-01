import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { DEFAULT_COLOR_THEME, themes } from "../styles/modes"; // You'll need to import your theme
import AppBarMenu from "./AppBar";

describe("AppBarMenu", () => {
  const mockSetMode = jest.fn();
  const theme = themes[DEFAULT_COLOR_THEME];
  const renderAppBar = (mode: "light" | "dark" | "dark_evil") => {
    return render(
      <ThemeProvider theme={theme}>
        <AppBarMenu
          setMode={mockSetMode}
          mode={mode}
          settingsOpen={false}
          setSettingsOpen={(hello: boolean) => {}}
        />
      </ThemeProvider>,
    );
  };

  beforeEach(() => {
    mockSetMode.mockClear();
  });

  it("renders the title correctly", () => {
    renderAppBar("light");
    expect(screen.getByText("MiniDSP Remote")).toBeInTheDocument();
  });

  it("renders all three theme toggle buttons", () => {
    renderAppBar("light");
    expect(screen.getByLabelText("Light Mode")).toBeInTheDocument();
    expect(screen.getByLabelText("Dark Mode")).toBeInTheDocument();
    expect(screen.getByLabelText("Evil Dark Mode")).toBeInTheDocument();
  });

  it("calls setMode with correct value when light mode is selected", () => {
    renderAppBar("dark");
    fireEvent.click(screen.getByLabelText("Light Mode"));
    expect(mockSetMode).toHaveBeenCalledWith("light");
  });

  it("calls setMode with correct value when dark mode is selected", () => {
    renderAppBar("light");
    fireEvent.click(screen.getByLabelText("Dark Mode"));
    expect(mockSetMode).toHaveBeenCalledWith("dark");
  });

  it("calls setMode with correct value when evil dark mode is selected", () => {
    renderAppBar("light");
    fireEvent.click(screen.getByLabelText("Evil Dark Mode"));
    expect(mockSetMode).toHaveBeenCalledWith("dark_evil");
  });

  it("highlights the current mode button", () => {
    renderAppBar("dark_evil");
    const evilButton = screen.getByLabelText("Evil Dark Mode");
    expect(evilButton.getAttribute("aria-pressed")).toBe("true");
  });
});
