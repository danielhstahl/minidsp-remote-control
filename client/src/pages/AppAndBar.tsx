//import { type Theme } from "@mui/material/styles";

//import Box from "@mui/material/Box";
//import Toolbar from "@mui/material/Toolbar";
import SSLNotification from "../components/SSLNotification";

import { Outlet, useLoaderData } from "react-router";

const AppAndBar = () => {
  const expiryDate = useLoaderData<Date>();
  return (
    <>
      <Outlet />
      <SSLNotification currentDate={new Date()} expiryDate={expiryDate} />
    </>
  );
};
export default AppAndBar;
