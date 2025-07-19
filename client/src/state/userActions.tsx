import type { User } from "../services/api";
import type { PropsWithChildren, } from "react"
import {
  useReducer,
  useContext,
  createContext,
} from "react";
import { getUserId } from "./persistance";

export enum SetUser {
  UPDATE,
}
type Action = {
  type: SetUser;
  value: User;
};


export const initiateUserState = () => ({
  userId: getUserId(),
  jwt: "",
})

export const userReducer = (state: User, action: Action) => {
  switch (action.type) {
    case SetUser.UPDATE:
      return action.value;
    default:
      return state;
  }
};
const UserContext = createContext({
  state: initiateUserState(),
  dispatch: (_: Action) => { },
});

export const UserProvider = ({ children }: PropsWithChildren) => {
  const [state, dispatch] = useReducer(userReducer, initiateUserState());
  return (
    <UserContext value={{ state, dispatch }}>
      {children}
    </UserContext>
  );
};

export const useUserParams = () => {
  return useContext(UserContext);
};
