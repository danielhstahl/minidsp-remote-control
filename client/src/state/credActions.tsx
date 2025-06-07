import { AuthSettings } from "../services/api";
import {
  useReducer,
  useContext,
  createContext,
  PropsWithChildren,
} from "react";

export enum SetKeys {
  UPDATE,
}
type Action = {
  type: SetKeys;
  value: AuthSettings;
};

const initialState = {
  key: 0,
  requireAuth: false, //hmmm
  stringToSign: "",
};

export const authSettingsReducer = (state: AuthSettings, action: Action) => {
  switch (action.type) {
    case SetKeys.UPDATE:
      return action.value;
    default:
      return state;
  }
};

const AuthSettingsContext = createContext({
  state: initialState,
  dispatch: (_: Action) => {},
});

export const AuthSettingsProvider = ({ children }: PropsWithChildren) => {
  const [state, dispatch] = useReducer(authSettingsReducer, initialState);

  return (
    <AuthSettingsContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthSettingsContext.Provider>
  );
};

export const useAuthSettingsParams = () => {
  return useContext(AuthSettingsContext);
};
