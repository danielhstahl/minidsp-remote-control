import type { PropsWithChildren, } from "react"
import {
    useReducer,
    useContext,
    createContext
} from "react";
import type { ColorTheme } from "../styles/modes";
import { getColorTheme } from "./persistance";

export enum SetTheme {
    UPDATE,
}
type Action = {
    type: SetTheme;
    value: ColorTheme;
};

export const themeReducer = (state: ColorTheme, action: Action) => {
    switch (action.type) {
        case SetTheme.UPDATE:
            return action.value;
        default:
            return state;
    }
};

const ThemeContext = createContext({
    state: getColorTheme(),
    dispatch: (_: Action) => { },
});

export const ThemeProvider = ({ children }: PropsWithChildren) => {
    const [state, dispatch] = useReducer(themeReducer, getColorTheme());
    return (
        <ThemeContext.Provider value={{ state, dispatch }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useThemeParams = () => {
    return useContext(ThemeContext);
};
