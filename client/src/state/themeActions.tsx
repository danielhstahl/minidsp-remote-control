import type { PropsWithChildren } from "react";
import { useReducer, useContext, createContext } from "react";
import type { ColorTheme } from "../styles/modes";
import { getColorTheme } from "./persistance";

export const SetThemeEnum = {
  UPDATE: "update",
} as const;

export type SetTheme = (typeof SetThemeEnum)[keyof typeof SetThemeEnum];

type Action = {
  type: SetTheme;
  value: ColorTheme;
};
// eslint-disable-next-line react-refresh/only-export-components
export const themeReducer = (state: ColorTheme, action: Action) => {
  switch (action.type) {
    case SetThemeEnum.UPDATE:
      return action.value;
    default:
      return state;
  }
};

const ThemeContext = createContext({
  state: getColorTheme(),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  dispatch: (_a: Action) => {},
});

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const [state, dispatch] = useReducer(themeReducer, getColorTheme());
  return (
    <ThemeContext.Provider value={{ state, dispatch }}>
      {children}
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useThemeParams = () => {
  return useContext(ThemeContext);
};
