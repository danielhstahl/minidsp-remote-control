import { User } from "../services/api";
import {
  useReducer,
  useContext,
  createContext,
  PropsWithChildren,
} from "react";

export enum SetUser {
  UPDATE,
}
type Action = {
  type: SetUser;
  value: User;
};

const initialState = {
  userId: 0,
  privateKey: "",
};

export const authSettingsReducer = (state: User, action: Action) => {
  switch (action.type) {
    case SetUser.UPDATE:
      return action.value;
    default:
      return state;
  }
};

const UserContext = createContext({
  state: initialState,
  dispatch: (_: Action) => {},
});

export const UserProvider = ({ children }: PropsWithChildren) => {
  const [state, dispatch] = useReducer(authSettingsReducer, initialState);
  return (
    <UserContext.Provider value={{ state, dispatch }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserParams = () => {
  return useContext(UserContext);
};
