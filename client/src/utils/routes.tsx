import Settings from "../pages/Settings";
import App from "../App";
import { redirect } from "react-router";
import { expiryLoader, statusLoader } from "../services/loaders";
import {
  setVolumeAction,
  setPresetAction,
  setPowerAction,
  setSourceAction,
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
        loader: expiryLoader, //api/cert/expiration (GET)
        children: [
          {
            path: "",
            Component: AppBody, //doesn't have an outlet
            loader: statusLoader, //api/status (GET)
            children: [
              { path: "volume", action: setVolumeAction },
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
        action: certAction,
      },
      {
        path: "/settings",
        Component: Settings,
      },
    ],
  },
  {
    path: "*",
    component: ErrorPage,
  },
];
