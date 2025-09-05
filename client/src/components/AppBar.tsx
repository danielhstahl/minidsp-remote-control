import MuiAppBar from "@mui/material/AppBar";
import type { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import SettingsIcon from "@mui/icons-material/Settings";
import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import ToggleButton from "@mui/material/ToggleButton";
import IconButton from "@mui/material/IconButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import type { ColorTheme } from "../styles/modes";
import { NavLink } from "react-router";
import Login from "@mui/icons-material/Login";

const drawerWidth: number = 240;
interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}
const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));
interface AppBarMenuProps {
  setMode: (mode: ColorTheme) => void;
  mode: ColorTheme;
  isAdmin: boolean;
}

const AppBarMenu = ({ setMode, mode, isAdmin }: AppBarMenuProps) => {
  return (
    <AppBar position="absolute" open={false}>
      <Toolbar
        sx={{
          pr: "24px", // keep right padding when drawer closed
        }}
      >
        <Typography
          component={NavLink}
          to="/"
          variant="h6"
          color="inherit"
          noWrap
          sx={{ flexGrow: 1 }}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          MiniDSP
        </Typography>
        {isAdmin && (
          <IconButton component={NavLink} to="/settings" aria-label="settings">
            <SettingsIcon />
          </IconButton>
        )}
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, v) => setMode(v)}
        >
          <ToggleButton value="light" aria-label="Light Mode">
            <LightModeIcon />
          </ToggleButton>
          <ToggleButton value="dark" aria-label="Dark Mode">
            <DarkModeIcon />
          </ToggleButton>
          <ToggleButton value="dark_evil" aria-label="Evil Dark Mode">
            <DarkModeIcon color="error" />
          </ToggleButton>
        </ToggleButtonGroup>
        {!isAdmin && (
          <IconButton component={NavLink} to="/login" aria-label="login">
            <Login />
          </IconButton>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default AppBarMenu;
