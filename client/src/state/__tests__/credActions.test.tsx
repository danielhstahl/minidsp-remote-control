import { render } from 'vitest-browser-react'
import { describe, expect, it } from 'vitest'
import {
  authSettingsReducer,
  AuthSettingsProvider,
  SetKeys,
  useAuthSettingsParams,
} from "../credActions";

describe("authSettingsReducer", () => {
  const initialState = {
    key: 1,
    requireAuth: true,
    domainName: "",
  };

  it("should return initial state when called with unknown action", () => {
    const result = authSettingsReducer(initialState, {
      // @ts-ignore - Testing invalid action type
      type: "UNKNOWN",
      // @ts-ignore - Testing invalid action type
      value: {},
    });
    expect(result).toBe(initialState);
  });

  it("should update state when called with UPDATE action", () => {
    const newState = {
      key: 1,
      requireAuth: true,
      domainName: "hello",
    };

    const result = authSettingsReducer(initialState, {
      type: SetKeys.UPDATE,
      value: newState,
    });

    expect(result).toEqual(newState);
  });
});

describe("AuthSettingsProvider and useAuthParams", () => {
  it("should provide initial state to children", async () => {
    const TestComponent = () => {
      const { state } = useAuthSettingsParams();
      return <div data-testid="test">{JSON.stringify(state)}</div>;
    };

    const { getByTestId } = render(
      <AuthSettingsProvider>
        <TestComponent />
      </AuthSettingsProvider>
    );
    await expect.element(getByTestId("test")).toHaveTextContent('{"key":0,"requireAuth":false,"domainName":""}')
  });
});
