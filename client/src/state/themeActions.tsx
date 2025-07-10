import {
    useReducer,
    useContext,
    createContext,
    PropsWithChildren,
} from "react";
import { ColorTheme } from "../styles/modes";
import { getColorTheme } from "./persistance";

export enum SetTheme {
    UPDATE,
}
type Action = {
    type: SetTheme;
    value: ColorTheme;
};

const initialState = getColorTheme()


export const themeReducer = (state: ColorTheme, action: Action) => {
    switch (action.type) {
        case SetTheme.UPDATE:
            return action.value;
        default:
            return state;
    }
};

const ThemeContext = createContext({
    state: initialState,
    dispatch: (_: Action) => { },
});

export const ThemeProvider = ({ children }: PropsWithChildren) => {
    const [state, dispatch] = useReducer(themeReducer, initialState);
    return (
        <ThemeContext.Provider value={{ state, dispatch }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useThemeParams = () => {
    return useContext(ThemeContext);
};
