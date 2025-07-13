import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { MiniDspProvider } from "./state/minidspActions";
import { AuthSettingsProvider } from "./state/credActions";
import { UserProvider } from "./state/userActions";
import { ThemeProvider } from "./state/themeActions";
import { ExpiryProvider } from "./state/expiryActions";
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
    loader: () => getAuthSettings({}).then(({ requireAuth, key }) => refreshToken(requireAuth).then(user => ({
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
        <MiniDspProvider>
          <ThemeProvider>
            <ExpiryProvider>
              <RouterProvider router={router} />
            </ExpiryProvider>
          </ThemeProvider>
        </MiniDspProvider>
      </UserProvider>
    </AuthSettingsProvider>
  </React.StrictMode>
);

