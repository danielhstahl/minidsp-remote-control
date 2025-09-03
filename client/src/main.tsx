import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { createBrowserRouter, RouterProvider } from "react-router";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import { ThemeProvider } from "./state/themeActions";
import {
  deviceLoader,
  statusLoader,
  devicesLoader,
  expiryLoader,
} from "./services/loaders";
import {
  setVolumeAction,
  setPresetAction,
  setPowerAction,
  setSourceAction,
  loginAction,
  deviceAction,
  certAction,
} from "./services/actions";
import AppBody from "./pages/AppBody";
import AppAndBar from "./pages/AppAndBar";
const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

const router = createBrowserRouter([
  {
    path: "/",
    loader: deviceLoader,
    Component: App,
    children: [
      {
        path: "/",
        Component: AppAndBar,
        loader: expiryLoader,
        children: [
          {
            path: "/app",
            Component: AppBody, //doesn't have an outlet
            loader: statusLoader,
            children: [
              { path: "volume", action: setVolumeAction }, //how will this work with outlets?  or will it?
              { path: "preset", action: setPresetAction },
              { path: "power", action: setPowerAction },
              //{ path: "power/:powerToTurnOn", action: setPowerAction },
              { path: "source", action: setSourceAction },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "/settings/cert",
    action: certAction,
  },
  {
    path: "/settings",
    Component: Settings,
    loader: devicesLoader,
    action: deviceAction,
  },
  { path: "/login", Component: Login, action: loginAction },
]);

root.render(
  <React.StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>,
);
