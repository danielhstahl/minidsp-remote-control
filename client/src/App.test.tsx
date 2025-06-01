import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders MiniDSP Remote", () => {
  render(<App />);
  const linkElement = screen.getByText(/MiniDSP/i);
  expect(linkElement).toBeInTheDocument();
});
