import Settings from "../pages/Settings";
import Login from "../pages/Login";
import App from "../App";
import { redirect } from "react-router";
import {
  authAndExpiryLoader,
  statusLoader,
  devicesLoader,
} from "../services/loaders";
import {
  setVolumeAction,
  setPresetAction,
  setPowerAction,
  setSourceAction,
  loginAction,
  deviceAction,
  certAction,
} from "../services/actions";
import AppBody from "../pages/AppBody";
import ExpiryWrapper from "../pages/ExpiryWrapper";
import ErrorPage from "../pages/Error";

export const routes = [
  {
    path: "/",
    Component: App, //includes appbar
    children: [
      {
        index: true,
        loader: () => redirect("/app"),
      },
      {
        path: "/app",
        Component: ExpiryWrapper,
        loader: authAndExpiryLoader, //api/cert/expiration (GET), and //api/device (POST)
        children: [
          {
            path: "",
            Component: AppBody, //doesn't have an outlet
            loader: statusLoader, //api/status (GET)
            children: [
              { path: "volume", action: setVolumeAction }, //how will this work with outlets?  or will it?
              { path: "preset", action: setPresetAction },
              { path: "power", action: setPowerAction },
              { path: "source", action: setSourceAction },
            ],
          },
        ],
        ErrorBoundary: ErrorPage,
      },
      {
        path: "/settings/cert",
        action: certAction, //auth required
      },
      {
        path: "/settings",
        Component: Settings,
        loader: devicesLoader, //api/device (GET), auth required
        action: deviceAction,
      },
      { path: "/login/:ip?", Component: Login, action: loginAction },
    ],
  },
  {
    path: "*",
    component: ErrorPage,
  },
];
