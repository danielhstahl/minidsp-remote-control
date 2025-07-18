import { render } from 'vitest-browser-react'
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import SSLNotification, { showNotification } from "../SSLNotification";
import { ExpiryProvider, initialExpiryState } from "../../state/expiryActions";
import { SetExpiry, useExpiryParams } from "../../state/expiryActions";
import { useEffect } from "react";
import { http, HttpResponse } from 'msw'
import { setupWorker } from 'msw/browser'
const TestComponent = ({ currDate, expiryDate }: { currDate: Date, expiryDate: Date }) => {
  const {
    dispatch: expiryDispatch,
  } = useExpiryParams();
  useEffect(() => {
    expiryDispatch({ type: SetExpiry.UPDATE, value: { expiry: expiryDate } })
  }, [expiryDispatch])
  return <SSLNotification currentDate={currDate} />
}
const server = setupWorker(
  http.get('/api/cert/expiration', (_) => {
    return HttpResponse.json(initialExpiryState)
  }),
)

describe("SSNNotification", () => {
  beforeEach(async () => {
    await server.start({ quiet: true })
  })
  afterEach(() => server.stop())
  it("shows notification", async () => {
    const currDate = new Date("2025-05-05");
    const expiryDate = new Date("2025-06-03");

    const screen = render(
      <ExpiryProvider>
        <TestComponent currDate={currDate} expiryDate={expiryDate} />
      </ExpiryProvider >
    );
    await expect.element(screen.getByLabelText("SSL Banner")).toHaveStyle({ "visibility": "" })
  });
  it("does not show notification", async () => {
    const currDate = new Date("2025-05-05");
    const expiryDate = new Date("2025-08-05");

    const screen = render(
      <ExpiryProvider>
        <TestComponent currDate={currDate} expiryDate={expiryDate} />
      </ExpiryProvider >
    );
    await expect.element(screen.getByLabelText("SSL Banner")).toHaveStyle({ "visibility": "hidden" })
  });
});

describe("showNotification", () => {
  it("returns false if greater than 30 days", () => {
    const currDate = new Date("2025-05-05");
    const expiryDate = new Date("2025-08-05");
    expect(showNotification(currDate, expiryDate)).toBe(false);
  });
  it("returns true if less than 30 days", () => {
    const currDate = new Date("2025-05-05");
    const expiryDate = new Date("2025-06-03");
    expect(showNotification(currDate, expiryDate)).toBe(true);
  });
});
