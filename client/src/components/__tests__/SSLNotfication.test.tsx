import { render, screen } from "@testing-library/react";
import SSLNotification, { showNotification } from "../SSLNotification";

describe("SSNNotification", () => {
  it("shows notification", () => {
    const currDate = new Date("2025-05-05");
    const expiryDate = new Date("2025-06-03");
    render(<SSLNotification currentDate={currDate} expiry={expiryDate} />);
    console.log(screen.getByLabelText("SSL Banner").style.visibility);
    expect(screen.getByLabelText("SSL Banner").style.visibility).toEqual("");
  });
  it("does not show notification", () => {
    const currDate = new Date("2025-05-05");
    const expiryDate = new Date("2025-08-05");

    render(<SSLNotification currentDate={currDate} expiry={expiryDate} />);

    expect(screen.getByLabelText("SSL Banner").style.visibility).toEqual(
      "hidden"
    );
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
