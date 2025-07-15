import { render, screen, waitFor } from "@testing-library/react";
import SSLNotification, { showNotification } from "../SSLNotification";
import { ExpiryProvider } from "../../state/expiryActions";
import { SetExpiry, useExpiryParams } from "../../state/expiryActions";
import { useEffect } from "react";
const TestComponent = ({ currDate, expiryDate }: { currDate: Date, expiryDate: Date }) => {
  const {
    dispatch: expiryDispatch,
  } = useExpiryParams();
  useEffect(() => {
    expiryDispatch({ type: SetExpiry.UPDATE, value: { expiry: expiryDate } })
  }, [expiryDispatch])
  return < SSLNotification currentDate={currDate} />
}
describe("SSNNotification", () => {
  it("shows notification", async () => {
    const currDate = new Date("2025-05-05");
    const expiryDate = new Date("2025-06-03");

    render(
      <ExpiryProvider>
        <TestComponent currDate={currDate} expiryDate={expiryDate} />
      </ExpiryProvider >
    );
    await waitFor(() => {
      expect(screen.getByLabelText("SSL Banner").style.visibility).toEqual("");
    })


  });
  it("does not show notification", async () => {
    const currDate = new Date("2025-05-05");
    const expiryDate = new Date("2025-08-05");

    render(
      <ExpiryProvider>
        <TestComponent currDate={currDate} expiryDate={expiryDate} />
      </ExpiryProvider >
    );
    await waitFor(() => {
      expect(screen.getByLabelText("SSL Banner").style.visibility).toEqual(
        "hidden"
      );
    })
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
