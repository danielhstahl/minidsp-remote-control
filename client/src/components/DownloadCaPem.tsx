import DownloadForOfflineIcon from "@mui/icons-material/DownloadForOffline";
import Button from "@mui/material/Button";
import { useUserParams } from "../state/userActions";
import { addAuthHeaders } from "../services/api";
import { getCaPem } from "../services/api";

const DownloadCaPem = () => {
  const {
    state: { userId, jwt },
  } = useUserParams();
  const getCaPemHOF = () => {
    return getCaPem(addAuthHeaders(userId, jwt));
  };
  return (
    <Button
      variant="contained"
      onClick={getCaPemHOF}
      startIcon={<DownloadForOfflineIcon />}
      sx={{
        "& .MuiButton-endIcon": {
          position: "absolute",
          right: "1rem",
        },
        "& .MuiButton-startIcon": {
          position: "absolute",
          left: "1rem",
        },
      }}
    >
      Download root cert
    </Button>
  );
};
export default DownloadCaPem;
