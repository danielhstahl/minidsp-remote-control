import type { SSLCertExpiry } from "../services/api";
import type { PropsWithChildren } from "react"
import {
    useReducer,
    useContext,
    createContext,
} from "react";

export enum SetExpiry {
    UPDATE,
}
type Action = {
    type: SetExpiry;
    value: SSLCertExpiry;
};

//for testing
export const get60DaysFuture = () => {
    let date = new Date();
    // Add 60 days to the current date
    date.setDate(date.getDate() + 60);
    return date
}
export const initialExpiryState: SSLCertExpiry = {
    expiry: get60DaysFuture()
};

export const expiryReducer = (state: SSLCertExpiry, action: Action) => {
    switch (action.type) {
        case SetExpiry.UPDATE:
            return action.value;
        default:
            return state;
    }
};

const ExpiryContext = createContext({
    state: initialExpiryState,
    dispatch: (_: Action) => { },
});

export const ExpiryProvider = ({ children }: PropsWithChildren) => {
    const [state, dispatch] = useReducer(expiryReducer, initialExpiryState);
    return (
        <ExpiryContext.Provider value={{ state, dispatch }}>
            {children}
        </ExpiryContext.Provider>
    );
};

export const useExpiryParams = () => {
    return useContext(ExpiryContext);
};
