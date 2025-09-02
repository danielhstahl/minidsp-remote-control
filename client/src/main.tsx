import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { createBrowserRouter, RouterProvider } from "react-router";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import { deviceLoader, statusLoader, devicesLoader } from "./services/loaders";
import {
  setVolumeAction,
  setPresetAction,
  setPowerAction,
  setSourceAction,
  loginAction,
} from "./services/actions";
import AppBody from "./components/AppBody";
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
  { path: "/settings", Component: Settings, loader: devicesLoader },
  { path: "/login", Component: Login, action: loginAction },
]);

root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
