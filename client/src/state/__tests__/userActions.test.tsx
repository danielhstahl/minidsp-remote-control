import { render } from 'vitest-browser-react'
import { describe, expect, it } from 'vitest'
import {
  SetUser,
  userReducer,
  UserProvider,
  useUserParams,
} from "../userActions";

describe("userReducer", () => {
  const initialState = {
    userId: "-1",
    jwt: "",
  };

  it("should return initial state when called with unknown action", () => {
    const result = userReducer(initialState, {
      // @ts-ignore - Testing invalid action type
      type: "UNKNOWN",
      // @ts-ignore - Testing invalid action type
      value: {},
    });
    expect(result).toBe(initialState);
  });

  it("should update state when called with UPDATE action", () => {
    const newState = {
      userId: "2",
      jwt: "signature",
    };

    const result = userReducer(initialState, {
      type: SetUser.UPDATE,
      value: newState,
    });

    expect(result).toEqual(newState);
  });
});

describe("UserProvider and useProvider", () => {
  it("should provide initial state to children", async () => {
    const TestComponent = () => {
      const { state } = useUserParams();
      return <div data-testid="test">{JSON.stringify(state)}</div>;
    };

    const { getByTestId } = render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    await expect.element(getByTestId("test")).toHaveTextContent(JSON.stringify({
      userId: "-1",
      jwt: "",
    }))

  });
});
