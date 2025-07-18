import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

import { AuthSettingsProvider } from "./state/credActions";
import { UserProvider } from "./state/userActions";
import { ThemeProvider } from "./state/themeActions";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router";
import { getAuthSettings } from "./services/api";
import Settings from "./components/Settings";
import { refreshToken } from "./utils/refresh";
const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

let router = createBrowserRouter([
  {
    path: "/",
    Component: App,
    loader: () => getAuthSettings({}).then(({ requireAuth, key, domainName }) => refreshToken(requireAuth, domainName).then(user => ({
      user,
      authSettings: { requireAuth, key }
    }))),
    children: [
      { path: "settings", Component: Settings },
    ]
  }
]);


root.render(
  <React.StrictMode>
    <AuthSettingsProvider>
      <UserProvider>
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </UserProvider>
    </AuthSettingsProvider>
  </React.StrictMode>
);

