import { initiateUserState } from "../state/userActions"
import { generateJwt } from "../services/keyCreation";
import { useEffect, useRef } from 'react';

import {
    getPrivateKey,
    getUserId,
} from "../state/persistance";
export enum AuthCondition {
    noAuthRequiredNoJwt = 1,
    authRequiredNoJwt = 2,
    authRequiredJwt = 3,
}

//export for testing
export const filterState = (jwt: string, requireAuth: boolean) => {
    if (requireAuth && jwt !== "") {
        return AuthCondition.authRequiredJwt
    }
    if (requireAuth && jwt === "") {
        return AuthCondition.authRequiredNoJwt
    }
    return AuthCondition.noAuthRequiredNoJwt
}


export const refreshToken = async (requireAuth: boolean) => {
    const privateKey = getPrivateKey();
    if (requireAuth && privateKey !== "") {
        const userId = getUserId();
        const jwt = await generateJwt(privateKey, userId, process.env.REACT_APP_AUDIENCE || "", "shouldnotmatter")
        return {
            userId,
            jwt
        }
    }
    return initiateUserState()
}

export const refreshStatus = (jwt: string, requireAuth: boolean, getParams: () => Promise<void>) => {
    switch (filterState(jwt, requireAuth)) {
        case AuthCondition.authRequiredJwt:
        case AuthCondition.noAuthRequiredNoJwt:
            getParams()
            break
    }
}

//https://overreacted.io/making-setinterval-declarative-with-react-hooks/
export function useInterval(callback: () => void, refreshRate: number, executeImmediate: boolean = false) {
    const savedCallback = useRef<() => void>(callback);

    // Remember the latest callback.
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval.
    useEffect(() => {
        function tick() {
            savedCallback.current();
        }
        if (executeImmediate) {
            tick()
        }
        if (refreshRate !== null) {
            let id = setInterval(tick, refreshRate);
            return () => clearInterval(id);
        }
    }, [refreshRate]);
}