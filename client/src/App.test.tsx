import { render, screen } from "@testing-library/react";
import App from "./App";
import { MemoryRouter } from "react-router";
test("renders MiniDSP Remote", () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
  const linkElement = screen.getByText(/MiniDSP/i);
  expect(linkElement).toBeInTheDocument();
});
