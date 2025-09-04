import { render } from "vitest-browser-react";
import { describe, expect, it } from "vitest";
import {
  SetThemeEnum,
  themeReducer,
  ThemeProvider,
  useThemeParams,
} from "../themeActions";
import { getColorTheme } from "../persistance";

describe("themeReducer", () => {
  const initialState = getColorTheme();

  it("should return initial state when called with unknown action", () => {
    const result = themeReducer(initialState, {
      // @ts-expect-error 2322
      type: "UNKNOWN",
      // @ts-expect-error 2322
      value: {},
    });
    expect(result).toBe(initialState);
  });

  it("should update state when called with UPDATE action", () => {
    const newState = "dark";

    const result = themeReducer(initialState, {
      type: SetThemeEnum.UPDATE,
      value: newState,
    });

    expect(result).toEqual(newState);
  });
});

describe("UserProvider and useProvider", () => {
  it("should provide initial state to children", async () => {
    const TestComponent = () => {
      const { state } = useThemeParams();
      return <div data-testid="test">{JSON.stringify(state)}</div>;
    };

    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    await expect.element(getByTestId("test")).toHaveTextContent("light");
  });
});
