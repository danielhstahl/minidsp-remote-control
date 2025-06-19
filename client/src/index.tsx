import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { MiniDspProvider } from "./state/minidspActions";
import { AuthSettingsProvider } from "./state/credActions";
import { UserProvider } from "./state/userActions";
import { BrowserRouter, Routes, Route } from "react-router";
const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <AuthSettingsProvider>
      <UserProvider>
        <MiniDspProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" index element={<App />} />
              {
                //does this force rerender??  If so, consider an alternative approach
              }
              <Route path="/settings" element={<App />} />
            </Routes>
          </BrowserRouter>
        </MiniDspProvider>
      </UserProvider>
    </AuthSettingsProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
