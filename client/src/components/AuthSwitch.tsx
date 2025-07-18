import Switch from "@mui/material/Switch";
import { applyThemePrimaryType } from "../styles/modes";
import { SetKeys, useAuthSettingsParams } from "../state/credActions";
import { useUserParams } from "../state/userActions";
import { setAuthSettings, addAuthHeaders } from "../services/api";
import { useThemeParams } from "../state/themeActions";

const AuthSwitch = () => {
  const {
    dispatch: authDispatch,
    state: { requireAuth, ...rest },
  } = useAuthSettingsParams();
  const {
    state: selectedTheme
  } = useThemeParams();
  const {
    state: { jwt, userId },
  } = useUserParams();
  return (
    <Switch
      disabled={jwt === ""}
      color={applyThemePrimaryType(selectedTheme)}
      checked={requireAuth}
      onChange={(e) => {
        const switchValue = e.target.checked;
        setAuthSettings(addAuthHeaders(userId, jwt), switchValue)
          .then((result) => {
            authDispatch({
              type: SetKeys.UPDATE,
              value: result,
            });
          })
          .catch((e) => {
            authDispatch({
              type: SetKeys.UPDATE,
              value: { ...rest, requireAuth: !switchValue },
            });
          });
        authDispatch({
          type: SetKeys.UPDATE,
          value: { ...rest, requireAuth: switchValue },
        });
      }}
    />
  );
};

export default AuthSwitch;
