import { render } from 'vitest-browser-react'
import { describe, expect, it } from 'vitest'
import {
    SetExpiry,
    expiryReducer,
    get60DaysFuture,
    ExpiryProvider,
    useExpiryParams,
} from "../expiryActions";

describe("expiryReducer", () => {
    const initialState = {
        expiry: new Date()
    };

    it("should return initial state when called with unknown action", () => {
        const result = expiryReducer(initialState, {
            // @ts-ignore - Testing invalid action type
            type: "UNKNOWN",
            // @ts-ignore - Testing invalid action type
            value: {},
        });
        expect(result).toBe(initialState);
    });

    it("should update state when called with UPDATE action", () => {
        const newState = {
            expiry: get60DaysFuture()
        };

        const result = expiryReducer(initialState, {
            type: SetExpiry.UPDATE,
            value: newState,
        });

        expect(result).toEqual(newState);
    });
});

describe("ExpiryProvider and useProvider", () => {
    it("should provide initial state to children", async () => {
        const TestComponent = () => {
            const { state } = useExpiryParams();
            const keys = Object.keys(state).reduce((a, i) => a + i)
            return <div data-testid="test">{keys}</div>;
        };

        const { getByTestId } = render(
            <ExpiryProvider>
                <TestComponent />
            </ExpiryProvider>
        );

        await expect.element(getByTestId("test")).toHaveTextContent('expiry')
    });
});
