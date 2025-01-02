import { HtxWrite, Source, Preset, Power } from "../services/api";
import { useReducer, useContext, createContext, PropsWithChildren } from "react"

export enum WriteAction {
    UPDATE
}
type Action = {
    type: WriteAction,
    value: HtxWrite
}
export const MIN_VOLUME = -127
export const MAX_VOLUME = 0
const initialState = {
    preset: Preset.preset1,
    source: Source.USB,
    volume: MIN_VOLUME,
    power: Power.On
}


export const writeReducer = (state: HtxWrite, action: Action) => {
    switch (action.type) {
        case WriteAction.UPDATE:
            return action.value;
        default:
            return state;
    }
};

const WriteContext = createContext({ state: initialState, dispatch: (_: Action) => { } });

export const WriteProvider = ({ children }: PropsWithChildren) => {
    const [state, dispatch] = useReducer(writeReducer, initialState);

    return (
        <WriteContext.Provider value={{ state, dispatch }}>
            {children}
        </WriteContext.Provider>
    );
};

export const useWriteParams = () => {
    return useContext(WriteContext);
};