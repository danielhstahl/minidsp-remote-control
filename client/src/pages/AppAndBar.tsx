import { type Theme } from "@mui/material/styles";

import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";

import AppBar from "../components/AppBar";

import type { ColorTheme } from "../styles/modes";
import SSLNotification from "../components/SSLNotification";

import { Outlet, useLoaderData, useOutletContext } from "react-router";

interface Props {
  selectedTheme: ColorTheme;
  setThemeAndSave: (theme: ColorTheme) => void;
}
const AppAndBar = () => {
  const { selectedTheme, setThemeAndSave } = useOutletContext<Props>();
  const expiryDate = useLoaderData<Date>();
  return (
    <>
      <AppBar mode={selectedTheme} setMode={setThemeAndSave} />
      <Box
        component="main"
        sx={{
          backgroundColor: (theme: Theme) => theme.palette.background.default,
          flexGrow: 1,
          height: "100vh",
          overflow: "auto",
        }}
      >
        <Toolbar />
        <Outlet />
        <SSLNotification currentDate={new Date()} expiryDate={expiryDate} />
      </Box>
    </>
  );
};
export default AppAndBar;
