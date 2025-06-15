import Switch from "@mui/material/Switch";
import { ColorTheme, applyThemePrimaryType } from "../styles/modes";
import { SetKeys, useAuthSettingsParams } from "../state/credActions";
import { useUserParams } from "../state/userActions";
import { setAuthSettings, addAuthHeaders } from "../services/api";
interface Props {
  mode: ColorTheme;
}

const AuthSwitch = ({ mode }: Props) => {
  const {
    dispatch: authDispatch,
    state: { requireAuth, ...rest },
  } = useAuthSettingsParams();
  const {
    state: { signature, userId },
  } = useUserParams();

  return (
    <Switch
      disabled={signature === ""}
      color={applyThemePrimaryType(mode)}
      checked={requireAuth}
      onChange={(e) => {
        const switchValue = e.target.checked;
        setAuthSettings(addAuthHeaders(userId, signature), switchValue).then(
          (result) => {
            authDispatch({
              type: SetKeys.UPDATE,
              value: result,
            });
          }
        );
        authDispatch({
          type: SetKeys.UPDATE,
          value: { ...rest, requireAuth: switchValue },
        });
      }}
    />
  );
};

export default AuthSwitch;
