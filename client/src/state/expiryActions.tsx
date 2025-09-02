import type { SSLCertExpiry } from "../services/api";
import type { PropsWithChildren } from "react";
import { useReducer, useContext, createContext } from "react";

export const SetExpiryEnum = {
  UPDATE: "update",
} as const;
export type SetExpiry = (typeof SetExpiryEnum)[keyof typeof SetExpiryEnum];
type Action = {
  type: SetExpiry;
  value: SSLCertExpiry;
};

//for testing
//eslint-disable-next-line react-refresh/only-export-components
export const get60DaysFuture = () => {
  const date = new Date();
  // Add 60 days to the current date
  date.setDate(date.getDate() + 60);
  return date;
};
// eslint-disable-next-line react-refresh/only-export-components
export const initialExpiryState: SSLCertExpiry = {
  expiry: get60DaysFuture(),
};
// eslint-disable-next-line react-refresh/only-export-components
export const expiryReducer = (state: SSLCertExpiry, action: Action) => {
  switch (action.type) {
    case SetExpiryEnum.UPDATE:
      return action.value;
    default:
      return state;
  }
};

const ExpiryContext = createContext({
  state: initialExpiryState,
  dispatch: (_a: Action) => {},
});

export const ExpiryProvider = ({ children }: PropsWithChildren) => {
  const [state, dispatch] = useReducer(expiryReducer, initialExpiryState);
  return (
    <ExpiryContext.Provider value={{ state, dispatch }}>
      {children}
    </ExpiryContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useExpiryParams = () => {
  return useContext(ExpiryContext);
};
