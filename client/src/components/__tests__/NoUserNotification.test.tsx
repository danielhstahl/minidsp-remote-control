import { render } from 'vitest-browser-react'
import { describe, expect, it } from 'vitest'
import NoUserNotification, { showNotification } from "../NoUserNotification";
import { useEffect } from "react";
import {
  AuthSettingsProvider,
  useAuthSettingsParams,
  SetKeys,
} from "../../state/credActions";
describe("NoUserNotification", () => {
  it("shows notification", () => {
    const DummyComponent = () => {
      const { dispatch: authDispatch } = useAuthSettingsParams();
      useEffect(() => {
        authDispatch({
          type: SetKeys.UPDATE,
          value: {
            key: 0,
            requireAuth: true,
            domainName: "hello"
          },
        });
      }, [authDispatch]);
      return <></>;
    };
    const screen = render(
      <AuthSettingsProvider>
        <DummyComponent />
        <NoUserNotification signature="" />
      </AuthSettingsProvider>,
    );

    expect(screen.getByLabelText("No User Banner")).toHaveStyle({ 'visibility': "" })

  });
  it("does not show notification", () => {
    const screen = render(
      <AuthSettingsProvider>
        <NoUserNotification signature="" />
      </AuthSettingsProvider>,
    );

    expect(screen.getByLabelText("No User Banner")).toHaveStyle({ 'visibility': "hidden" })
  });
});

describe("showNotification", () => {
  it("returns false if signature is not empty", () => {
    const signature = "hello";
    const requireAuth = true;
    expect(showNotification(signature, requireAuth)).toBe(false);
  });
  it("returns false if requireAuth is false", () => {
    const signature = "";
    const requireAuth = false;
    expect(showNotification(signature, requireAuth)).toBe(false);
  });
  it("returns true if signature is  empty and requireAuth is true", () => {
    const signature = "";
    const requireAuth = true;
    expect(showNotification(signature, requireAuth)).toBe(true);
  });
});
