import { render, screen } from "@testing-library/react";
import App from "./App";
import { createMemoryRouter, RouterProvider } from "react-router";
import { initialUserState } from "./state/userActions"

let router = createMemoryRouter([
  {
    path: "/",
    Component: App,
    loader: () => Promise.resolve({
      user: initialUserState,
      authSettings: {
        key: 0,
        requireAuth: true
      }
    })
  }
]);
test("renders MiniDSP Remote", () => {
  render(
    <RouterProvider router={router} />
  );
  const linkElement = screen.getByText(/MiniDSP/i);
  expect(linkElement).toBeInTheDocument();
});
