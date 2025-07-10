import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { MiniDspProvider } from "./state/minidspActions";
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
    loader: () => getAuthSettings({}).then(({ requireAuth, key, certInfo }) => refreshToken(requireAuth).then(user => ({
      user,
      authSettings: { requireAuth, key, certInfo }
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
            <RouterProvider router={router} />
          </ThemeProvider>
        </MiniDspProvider>
      </UserProvider>
    </AuthSettingsProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
