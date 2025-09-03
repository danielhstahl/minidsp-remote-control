import DownloadForOfflineIcon from "@mui/icons-material/DownloadForOffline";
import Button from "@mui/material/Button";
import { getCaPem } from "../services/api";

const DownloadCaPem = () => {
  const getCaPemHOF = () => {
    return getCaPem();
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
