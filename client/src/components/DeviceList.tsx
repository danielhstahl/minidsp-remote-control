import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
//import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Switch from "@mui/material/Switch";
import { type Device } from "../services/api";
import { useFetcher } from "react-router";
import { CircularProgress } from "@mui/material";
interface Props {
  devices: Device[];
}

const SwitchWithFetcher = ({ isAllowed, deviceIp }: Device) => {
  const fetcher = useFetcher();
  const busy = fetcher.state !== "idle";
  const displayIsAllowed =
    fetcher.data && fetcher.data.isAllowed !== undefined
      ? fetcher.data.isAllowed
      : isAllowed;
  return busy ? (
    <CircularProgress />
  ) : (
    <Switch
      edge="end"
      data-testid={deviceIp}
      onChange={(_e, checked: boolean) => {
        const form = new FormData();
        form.append("device", JSON.stringify({ isAllowed: checked, deviceIp }));
        fetcher.submit(form, { action: `/settings`, method: "post" });
      }}
      checked={displayIsAllowed}
    />
  );
};
const DeviceList = ({ devices }: Props) => {
  return (
    <List
      sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}
      subheader={<ListSubheader>Allowed IPs</ListSubheader>}
    >
      {devices.map(({ deviceIp, isAllowed }) => {
        return (
          <ListItem key={deviceIp}>
            <ListItemText primary={deviceIp} />
            <SwitchWithFetcher deviceIp={deviceIp} isAllowed={isAllowed} />
          </ListItem>
        );
      })}
    </List>
  );
};

export default DeviceList;
