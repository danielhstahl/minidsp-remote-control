import { render } from "@testing-library/react";
import { SSLCertExpiry } from "../../services/api";
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
    it("should provide initial state to children", () => {
        const TestComponent = () => {
            const { state } = useExpiryParams();
            return <div data-testid="test">{JSON.stringify(state)}</div>;
        };

        const { getByTestId } = render(
            <ExpiryProvider>
                <TestComponent />
            </ExpiryProvider>
        );

        const element = getByTestId("test");
        expect(JSON.parse(element.textContent!)).toHaveProperty("expiry")
    });
});
