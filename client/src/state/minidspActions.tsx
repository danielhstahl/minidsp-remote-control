import { HtxWrite, Source, Preset, Power } from "../services/api";
import {
  useReducer,
  useContext,
  createContext,
  PropsWithChildren,
} from "react";

export enum MinidspAction {
  UPDATE,
}
export type Action = {
  type: MinidspAction;
  value: HtxWrite;
};
export const MIN_VOLUME = -127;
export const MAX_VOLUME = 0;
const initialState = {
  preset: Preset.preset1,
  source: Source.USB,
  volume: MIN_VOLUME,
  power: Power.On,
};

export const miniDspReducer = (state: HtxWrite, action: Action) => {
  switch (action.type) {
    case MinidspAction.UPDATE:
      return action.value;
    default:
      return state;
  }
};

const MiniDspContext = createContext({
  state: initialState,
  dispatch: (_: Action) => {},
});

export const MiniDspProvider = ({ children }: PropsWithChildren) => {
  const [state, dispatch] = useReducer(miniDspReducer, initialState);

  return (
    <MiniDspContext.Provider value={{ state, dispatch }}>
      {children}
    </MiniDspContext.Provider>
  );
};

export const useMiniDspParams = () => {
  return useContext(MiniDspContext);
};
