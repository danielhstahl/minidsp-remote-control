import { type Theme } from "@mui/material/styles";

import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import SSLNotification from "../components/SSLNotification";

import { Outlet, useLoaderData } from "react-router";

const AppAndBar = () => {
  const expiryDate = useLoaderData<Date>();
  return (
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
  );
};
export default AppAndBar;
