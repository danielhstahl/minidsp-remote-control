import { render } from "vitest-browser-react";
import { describe, expect, it } from "vitest";
import SSLNotification, { showNotification } from "../SSLNotification";

describe("SSNNotification", () => {
  it("shows notification", async () => {
    const currDate = new Date("2025-05-05");
    const expiryDate = new Date("2025-06-03");
    const screen = render(
      <SSLNotification currentDate={currDate} expiryDate={expiryDate} />,
    );
    await expect
      .element(screen.getByLabelText("SSL Banner"))
      .toHaveStyle({ visibility: "" });
  });
  it("does not show notification", async () => {
    const currDate = new Date("2025-05-05");
    const expiryDate = new Date("2025-08-05");
    const screen = render(
      <SSLNotification currentDate={currDate} expiryDate={expiryDate} />,
    );
    await expect
      .element(screen.getByLabelText("SSL Banner"))
      .toHaveStyle({ visibility: "hidden" });
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
