import { User } from "../services/api";
import {
  useReducer,
  useContext,
  createContext,
  PropsWithChildren,
} from "react";
import { getUserId } from "./persistance";

export enum SetUser {
  UPDATE,
}
type Action = {
  type: SetUser;
  value: User;
};

export const initialUserState = {
  userId: getUserId(),
  jwt: "",
};

export const userReducer = (state: User, action: Action) => {
  switch (action.type) {
    case SetUser.UPDATE:
      return action.value;
    default:
      return state;
  }
};

const UserContext = createContext({
  state: initialUserState,
  dispatch: (_: Action) => { },
});

export const UserProvider = ({ children }: PropsWithChildren) => {
  const [state, dispatch] = useReducer(userReducer, initialUserState);
  return (
    <UserContext.Provider value={{ state, dispatch }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserParams = () => {
  return useContext(UserContext);
};
