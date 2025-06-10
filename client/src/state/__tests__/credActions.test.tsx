import { render } from "@testing-library/react";
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
    stringToSign: "",
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
      stringToSign: "hello",
      certInfo: {
        subject: "hi",
        issuer: "hello",
        validFrom: "somedate1",
        validTo: "somedate2",
        validFromDate: new Date(),
        validToDate: new Date(),
      },
    };

    const result = authSettingsReducer(initialState, {
      type: SetKeys.UPDATE,
      value: newState,
    });

    expect(result).toEqual(newState);
  });
});

describe("AuthSettingsProvider and useAuthParams", () => {
  it("should provide initial state to children", () => {
    const TestComponent = () => {
      const { state } = useAuthSettingsParams();
      return <div data-testid="test">{JSON.stringify(state)}</div>;
    };

    const { getByTestId } = render(
      <AuthSettingsProvider>
        <TestComponent />
      </AuthSettingsProvider>
    );

    const element = getByTestId("test");
    expect(JSON.parse(element.textContent!)).toEqual({
      key: 0,
      requireAuth: false,
      stringToSign: "",
    });
  });
});
